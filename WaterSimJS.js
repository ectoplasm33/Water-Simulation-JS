
if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.");
}

const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
}

const device = await adapter.requestDevice();

const canvas = document.querySelector('canvas');
const context = canvas.getContext('webgpu');
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();

context.configure({
    device: device,
    format: canvasFormat,
    alphaMode: 'premultiplied',
});

const encoder = device.createCommandEncoder();

const pass = encoder.beginRenderPass({
    colorAttachments: [{
     view: context.getCurrentTexture().createView(),
     loadOp: "clear",
     storeOp: "store",
  }]
});

pass.end();



// async function main() {
//     const { device, context } = await initWebGPU();
    
//     // Now you use 'device' to create buffers and pipelines
//     const particleBufferSize = num_particles * 8;
//     const particleBuffer = device.createBuffer({
//         size: particleBufferSize,
//         usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
//         label: "Main Particle Buffer"
//     });

//     const shaderModule = device.createShaderModule({
//         label: "Water Simulation Shader", // Helpful for debugging in DevTools
//         code: waterShaderCode
//     });

//     // Assuming you have already created a 'shaderModule'
//     const pipeline = device.createRenderPipeline({
//         layout: 'auto', // 2025 standard for automatic bind group layouts
//         vertex: {
//             module: shaderModule,
//             entryPoint: 'vs_main', // Must match your WGSL function name
//             buffers: [{
//                 arrayStride: 8, // 2 floats * 4 bytes each
//                 attributes: [{
//                     shaderLocation: 0,
//                     offset: 0,
//                     format: 'float32x2'
//                 }]
//             }]
//         },
//         fragment: {
//             module: shaderModule,
//             entryPoint: 'fs_main',
//             targets: [{
//                 format: navigator.gpu.getPreferredCanvasFormat()
//             }]
//         },
//         primitive: {
//             topology: 'point-list' // Efficient for large particle systems
//         }
//     });

//     // Start the continuous loop
//     requestAnimationFrame((timestamp) => frame(device, context, pipeline, timestamp));
// }

let num_particles = 2000;
let influence_radius = 50;
let target_density = 4;
let pressure_multiplier = 2;
let viscosity_multiplier = 0.05;



main();