import {
    num_particles,
    max_particles,
    influence_radius,
    target_density,
    pressure_multiplier,
    viscosity_multipler,
    surface_tension_mp,
    gravity,
    h_sq,
    repulsion_radius,
    inv_rep_r,
    inv_h,
    cell_size,
    inv_cs,
    target_fps,
    delay,
    mouse_strength,
    mouse_r2,
    lmb,
    rmb,
    mouse_x,
    mouse_y,
    render_colors,
    show_ui,
    show_fps
} from './WaterSimSetup.js';

let active = true;

const grid = new Map();

const num_vars = 7;
const render_vars = 3

const particle_data = new Float32Array(max_particles * num_vars);
const new_particles = new Float32Array(max_particles * num_vars);
const normalized_particles = new Float32Array(max_particles * render_vars)

const max_neighbors = 150;
const particle_neighbors = new Array(max_particles);
const particle_neighbor_count = new Int16Array(max_particles);

const neighbor_info = new Array(max_particles);

const calculated_values = new Array(max_particles);

const particle_keys = new Int32Array(max_particles);

const canvas = document.querySelector('canvas');
canvas.x = 0;
canvas.y = 0;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particle_radius = 3.0 / canvas.width;

for (let i = 0; i < num_particles; i++) {
    let j = i*num_vars;
    particle_data[j] = (Math.random()-0.5) * canvas.width;
    particle_data[j+1] = (Math.random()-0.5) * canvas.height;
    particle_data[j+2] = 0;
    particle_data[j+3] = 0;
    particle_data[j+4] = 0;
    particle_data[j+5] = 0;
    particle_data[j+6] = 0;

    for (let k = 0; k < num_vars; k++) {
        new_particles[j+k] = 0;
    }

    normalized_particles[i*render_vars+2] = particle_radius;
}

for (let i = 0; i < max_particles; i++) {
    particle_neighbors[i] = new Int32Array(max_neighbors);
    neighbor_info[i] = new Array(max_neighbors);
    calculated_values[i] = new Float32Array(4)
    particle_neighbor_count[i] = 0;

    for (let j = 0; j < max_neighbors; j++) {
        neighbor_info[i][j] = new Float32Array(6);
    }
}

const canvas_x = canvas.width * 0.5;
const canvas_y = canvas.height * 0.5;

const grid_hash = canvas.width + 1;

const ratio = canvas.width / canvas.height;

const quad_vertices = new Float32Array([
  -1, -ratio,
   1, -ratio,
  -1,  ratio,
   1,  ratio,
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

const vertex_shader_code = `
struct vertexOutput {
    @builtin(position) position : vec4<f32>,
    @location(0) localPos : vec2<f32>,
    @location(1) radius : f32
};

@vertex
fn vs_main(
    @location(0) quadPos : vec2<f32>,
    @location(1) center : vec2<f32>,
    @location(2) radius : f32
) -> vertexOutput {
    var out : vertexOutput;

    out.position = vec4<f32>(
        center + quadPos * radius,
        0.0,
        1.0
    );

    out.localPos = quadPos;
    out.radius = radius;

    return out;
}
`;

const fragment_shader_code = `
@fragment
fn fs_main(
    @builtin(position) position : vec4<f32>,
    @location(0) localPos : vec2<f32>,
    @location(1) radius : f32
) -> @location(0) vec4<f32> {

    if (distance(localPos, position.xy) > radius) {
        discard;
    }

    return vec4<f32>(0, 0.156862745098, 0.941176470588, 0.666666666667);
}
`;

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
                arrayStride: render_vars * 4,
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

const inv_cw = 2.0 / canvas.width;
const inv_ch = 2.0 / canvas.height;

async function main_loop() {

    grid.clear();
    for (let i = 0; i < num_particles; i++) {
        const j = i*num_vars;
        
        const cx = 1e6 + Math.floor(particle_data[j+4] * inv_cs);
        const cy = 1e6 + Math.floor(particle_data[j+5] * inv_cs);

        const key = cy * grid_hash + cx;

        if (!grid.has(key)) {
            grid.set(key, []);
        }

        grid.get(key).push(i);

        particle_keys[i] = key;
    }

    for (let i = 0; i < num_particles; i++) {
        const p = i*num_vars;
        const k = particle_keys[i];

        let num = 0;
        let density = 0.0;
        
        let brk = false;
        for (let dy = -1; dy < 2; dy++) {
            const row_key = dy * grid_hash;

            for (let dx = -1; dx < 2; dx++) {
                const key = k + dx + row_key;
                
                if (!grid.has(key)) continue;

                const cell = grid.get(key);

                for (let j = 0; j < cell.length; j++) {
                    if (cell[j] == i) continue;
                    
                    const n = cell[j]*num_vars;

                    const dx = particle_data[n+4] - particle_data[p+4];
                    const dy = particle_data[n+5] - particle_data[p+5];
                    let dist = dx*dx + dy*dy;

                    if (dist < h_sq) {
                        particle_neighbors[i][num] = cell[j];
                        neighbor_info[i][num][0] = dx;
                        neighbor_info[i][num][1] = dy;
                        dist = Math.sqrt(dist);
                        neighbor_info[i][num][2] = dist;

                        let q = (influence_radius - dist) * inv_h;
                        let q2 = q*q;
                        let q3 = q2*q;

                        neighbor_info[i][num][3] = q;
                        neighbor_info[i][num][4] = q2;
                        neighbor_info[i][num][5] = q3;

                        density += q3;

                        num++;
                    }  

                    if (num == max_neighbors) { 
                        brk = true;
                        break;
                    }
                }   
                if (brk) break;
            }  
            if (brk) break;  
        }

        particle_data[p+6] = Math.max(density, 1e-6);

        particle_neighbor_count[i] = num;
    }

    for (let i = 0; i < num_particles; i++) {
        const p = i*num_vars;
        
        let fx = 0.0;
        let fy = 0.0;

        let nx = 0.0;
        let ny = 0.0;

        const pressure_i = (particle_data[p+6] - target_density) * pressure_multiplier;

        const count = particle_neighbor_count[i];

        for (let j = 0; j < count; j++) {
            const n = particle_neighbors[i][j]*num_vars;

            const neighbor = neighbor_info[i][j];

            const dist = neighbor[2];
            let inv_dst;

            if (dist == 0) {
                inv_dst = 0;
            } else {
                inv_dst = 1.0 / dist;
            }

            const n_x = neighbor[0] * inv_dst;
            const n_y = neighbor[1] * inv_dst;

            const n_density = particle_data[n+6]; 

            const pressure_j = (n_density - target_density) * pressure_multiplier;

            let inv_nd = 0.0;
            if (n_density > 0) {
                inv_nd = 1.0 / n_density;
            }

            let q2 = neighbor[4];

            const f = (pressure_i + pressure_j) * 0.5 * q2;

            fx -= f * n_x;
            fy -= f * n_y;

            let q = q2 * viscosity_multipler * inv_nd;

            fx += (particle_data[n+2] - particle_data[p+2]) * q;
            fy += (particle_data[n+3] - particle_data[p+3]) * q;

            nx += n_x * inv_nd;
            ny += n_y * inv_nd;

            if (dist < repulsion_radius) {
                q = (repulsion_radius - dist) * inv_rep_r;
                q2 = q*q;
                fx -= n_x * q2;
                fy -= n_y * q2;
            }
        }

        calculated_values[i][0] = fx;
        calculated_values[i][1] = fy;

        if (nx != 0 || ny != 0) {
            const inv_m = 1.0 / Math.sqrt(nx*nx + ny*ny);

            calculated_values[i][2] = nx * inv_m;
            calculated_values[i][3] = ny * inv_m;
        } else {
            calculated_values[i][2] = 0;
            calculated_values[i][3] = 0;
        }
    }

    for (let i = 0; i < num_particles; i++) {
        const p = i*num_vars;

        const values = calculated_values[i];

        let fx = values[0];
        let fy = values[1];

        const nx = values[2];
        const ny = values[3];

        let mag = nx*nx + ny*ny;

        if (mag > 0.01) {
            let k = 0.0;
            const size = particle_neighbor_count[i];

            for (let j = 0; j < size; j++) {
                const n = particle_neighbors[i][j]
                const neighbor_vals = calculated_values[n];
                const neighbor = neighbor_info[i][j];

                let d = neighbor[2] * particle_data[n*num_vars + 6];

                if (d == 0) {
                    d = 1;
                }

                k -= ((neighbor_vals[2] - nx) * neighbor[0] + (neighbor_vals[3] - ny) * neighbor[1]) * neighbor[5] / d;
            }

            k = Math.min(Math.max(k, -inv_rep_r), inv_rep_r);

            const q = surface_tension_mp * k;

            fx += nx * q;
            fy += ny * q;
        }

        let vx = particle_data[p+2] + fx;
        let vy = particle_data[p+3] + fy + gravity;

        const m2 = vx*vx + vy*vy;

        if (m2 > 1225) {
            const m1 = 35.0 / Math.sqrt(m2);

            vx *= m1;
            vy *= m1;
        }
        
        if (render_colors) {
            const m = Math.sqrt(m2);
            const m3 = m2 * m;
            //add color based on velocity
        }

        let x = particle_data[p] + vx;
        let y = particle_data[p+1] + vy;

        if (x < -canvas_x) {
            x = -canvas_x;
            vx *= -0.5;
        } else if (x > canvas_x) {
            x = canvas_x;
            vx *= -0.5;
        }
        if (y < -canvas_y) {
            y = -canvas_y;
            vy *= -0.5;
        } else if (y > canvas_y) {
            y = canvas_y;
            vy *= -0.5;
        }

        if (!show_ui) {
            const dx = mouse_x - x;
            const dy = mouse_y - y;
            const dist = dx*dx + dy*dy;

            if (dist < mouse_r2 && dist > 0) {
                const influence = mouse_strength / Math.sqrt(dist);

                if (lmb) {
                    vx -= dx * influence;
                    vy -= dy * influence;
                } 
                if (rmb) {
                    vx += dx * influence;
                    vy += dy * influence;
                }
            }
        }

        new_particles[p] = x;
        new_particles[p+1] = y;

        new_particles[p+2] = vx;
        new_particles[p+3] = vy;

        new_particles[p+4] = x + vx;
        new_particles[p+5] = y + vy;
    }

    const count = num_particles*num_vars;

    for (let i = 0; i < count; i++) {
        particle_data[i] = new_particles[i];
    }

    for (let i = 0; i < num_particles; i++) {
        let j1 = i*num_vars;
        let j2 = i*render_vars;
        
        normalized_particles[j2] = particle_data[j1] * inv_cw;
        normalized_particles[j2+1] = particle_data[j1+1] * inv_ch;
    }

    device.queue.writeBuffer(instance_buffer, 0, normalized_particles);

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
    pass.draw(4, num_particles, 0, 0);

    pass.end()

    device.queue.submit([encoder.finish()]);

    requestAnimationFrame(main_loop);
}

requestAnimationFrame(main_loop);