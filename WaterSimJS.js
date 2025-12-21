const canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const particle_radius = 3;

let num_particles = 1000;
let max_particles = 10000;
let influence_radius = 48.0;
let target_density  = 4.3;
let pressure_multiplier = 0.3;
let viscosity_multipler = 0.13;
let surface_tension_mp = 1.2;
let gravity = 0.3;

let h_sq = influence_radius * influence_radius;
let repulsion_radius = 0.5 * influence_radius;
let inv_rep_r = 1.0 / repulsion_radius;
let inv_h = 1.0 / influence_radius;
let cell_size = influence_radius;
let inv_cs = 1.0 / cell_size;

const target_fps = 120;
const delay = 1000.0 / target_fps;

let mouse_strength = 0.5;
let mouse_influence_r = 250.0;
let mouse_r2 = mouse_influence_r * mouse_influence_r;

let l_button = false;
let r_button = false;

let mouse_x;
let mouse_y;

let render_colors = false;
let show_ui = false;
let show_fps = false;

let active = true;

const num_vars = 4;

const particle_data = new Float32Array(max_particles * num_vars);

for (let i = 0; i < num_particles; i++) {
    let j = i*num_vars;
    particle_data[j] = (Math.random()-0.5) * canvas.width;
    particle_data[j+1] = (Math.random()-0.5) * canvas.height;
    particle_data[j+2] = 0;
    particle_data[j+3] = 0;
}

const quad_vertices = new Float32Array([
  -0.5, -0.5,
   0.5, -0.5,
  -0.5,  0.5,
   0.5,  0.5,
]);

if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.");
}

const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
}

const device = await adapter.requestDevice();

const context = canvas.getContext('webgpu');
const canvas_format = navigator.gpu.getPreferredCanvasFormat();

context.configure({
    device: device,
    format: canvas_format,
    alphaMode: 'premultiplied',
});

const quad_buffer = device.createBuffer({
  size: quad_vertices.byteLength,
  usage: GPUBufferUsage.VERTEX,
  mappedAtCreation: true
});

new Float32Array(quad_buffer.getMappedRange()).set(quad_vertices);
quad_buffer.unmap();

const instance_buffer = device.createBuffer({
    size: particle_data.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

const uniform_data = new Float32Array([canvas.width, canvas.height]);
// const uniform_buffer = device.createBuffer({
//     size: uniform_data.byteLength,
//     usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
// });
device.queue.writeBuffer(uniform_buffer, 0, uniform_data);

device.queue.writeBuffer(instance_buffer, 0, particle_data);

// const vertex_shader_code = `
// struct VertexOutput {
//     @builtin(position) position : vec4<f32>,
//     @location(0) localPos : vec2<f32>, // quad-local position
// };

// struct CanvasSize {
//     width : f32,
//     height : f32,
// };

// @vertex
// fn vs_main(
//     @location(0) quadPos : vec2<f32>,
//     @location(1) instancePos : vec2<f32>,   // pixels
//     @location(2) radius : f32               // pixels
// ) -> VertexOutput {

//     let inv_cw = 2.0 / canvas.width;
//     let inv_ch = 2.0 / canvas.height;

//     let ndcX = instancePos.x * inv_cw - 1.0;
//     let ndcY = 1.0 - instancePos.y * inv_ch;

//     let rX = radius * inv_cw;
//     let rY = radius * inv_ch;

//     var out : VertexOutput;
//     out.position = vec4<f32>(
//         ndcX + quadPos.x * rX,
//         ndcY + quadPos.y * rY,
//         0.0,
//         1.0
//     );

//     // Pass quad-local coordinates directly
//     out.localPos = quadPos;

//     return out;
// }
// `;

const vertex_shader_code = `
@vertex
fn vs_main(@builtin(vertex_index) i : u32) -> @builtin(position) vec4<f32> {
    var pos = array<vec2<f32>, 4>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>( 1.0, -1.0),
        vec2<f32>(-1.0,  1.0),
        vec2<f32>( 1.0,  1.0)
    );
    return vec4<f32>(pos[i], 0.0, 1.0);
}
`

// const fragment_shader_code = `
// @fragment
// fn fs_main(
//     @location(0) localPos : vec2<f32>
// ) -> @location(0) vec4<f32> {

//     // localPos ranges from -0.5 to 0.5
//     let dist = length(localPos);

//     if (dist > 0.5) {
//         discard;
//     }

//     return vec4<f32>(1.0, 0.5, 0.0, 1.0);
// }
// `

const fragment_shader_code = `
@fragment
fn fs_main() -> @location(0) vec4<f32> {
    return vec4<f32>(1.0, 0.0, 0.0, 1.0);
}
`

const vertex_module = device.createShaderModule({
    code: vertex_shader_code
});

const fragment_module = device.createShaderModule({
    code: fragment_shader_code
});

const pipeline = device.createRenderPipeline({
    vertex: {
        module: vertex_module,
        entryPoint: 'vs_main',
        buffers: [
            { // quad vertex buffer
                arrayStride: 2 * 4,
                attributes: [
                    { shaderLocation: 0, offset: 0, format: 'float32x2' }
                ]
            },
            { // instance buffer
                arrayStride: 3 * 4,
                stepMode: 'instance',
                attributes: [
                    { shaderLocation: 1, offset: 0, format: 'float32x2' }, // x,y
                    { shaderLocation: 2, offset: 2 * 4, format: 'float32' } // radius
                ]
            }
        ]
    },
    fragment: {
        module: fragment_module,
        entryPoint: 'fs_main',
        targets: [{ format: canvas_format }]
    },
    primitive: {
        topology: 'triangle-strip'
    },
    layout: 'auto'
});


// const bindGroup = device.createBindGroup({
//     layout: pipeline.getBindGroupLayout(0),
//     entries: [
//         {
//             binding: 0,
//             resource: { buffer: uniform_buffer }
//         }
//     ]
// });

// main loop
async function main_loop() {

    const encoder = device.createCommandEncoder();

    const pass = encoder.beginRenderPass({
        colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        loadOp: "clear",
        storeOp: "store",
    }]
    });

    pass.setPipeline(pipeline);
    // pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, quad_buffer);
    pass.setVertexBuffer(1, instance_buffer);
    pass.draw(4, 1, 0, 0);

    pass.end()

    device.queue.submit([encoder.finish()]);

    requestAnimationFrame(main_loop);
}

requestAnimationFrame(main_loop);