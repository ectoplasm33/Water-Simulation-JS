function pixels(value) {
    return String(value) + "px";
}

let num_particles = 3800;
let max_particles = 12000;
let influence_radius = 48.0;
let target_density  = 6.5;
let pressure_multiplier = 0.16;
let viscosity_multipler = 0.13;
let surface_tension_mp = 1.0;
let gravity = -0.25;

let h_sq = influence_radius * influence_radius;
let repulsion_radius = 0.5 * influence_radius;
let inv_rep_r = 1.0 / repulsion_radius;
let inv_h = 1.0 / influence_radius;
let cell_size = influence_radius;
let inv_cs = 1.0 / cell_size;

const target_fps = 120;
const delay = 1000.0 / target_fps;

let mouse_strength = .6;
let mouse_influence_r = 250.0;
let mouse_r2 = mouse_influence_r * mouse_influence_r;

let lmb = false;
let rmb = false;

let mouse_x = -1e5;
let mouse_y = -1e5;

let render_colors = false;
let show_ui = false;
let show_fps = false;

const slider_spacing = 50;
const top_spacing = 10;
const label_dy = 5;
const slider_dx = 10;
const slider_dy = 10;
const slider_width = 200;

const particle_count_slider = document.getElementById('particle_count_slider');
const particle_count_label = document.getElementById('particle_count_label');
particle_count_slider.min = 500;
particle_count_slider.max = max_particles;
particle_count_slider.value = num_particles;
particle_count_slider.width = pixels(slider_width);
particle_count_slider.left = pixels(slider_dx);
particle_count_slider.bottom = pixels(slider_dy);
particle_count_label.left = pixels(slider_dx + slider_width * 0.5);
particle_count_label.bottom = pixels(slider_dy + label_dy);
particle_count_label.innerHTML = particle_count_slider.value;

const influence_radius_slider = document.getElementById('influence_radius_slider');
const influence_radius_label = document.getElementById('influence_radius_label');
influence_radius_slider.min = 10 * 1000;
influence_radius_slider.max = 150 * 1000;
influence_radius_slider.value = influence_radius * 1000;
influence_radius_slider.width = pixels(slider_width);
influence_radius_slider.left = pixels(slider_dx);
influence_radius_slider.bottom = pixels(top_spacing + slider_dy);
influence_radius_label.left = pixels(slider_dx + slider_width * 0.5);
influence_radius_label.bottom = pixels(top_spacing + slider_dy + label_dy);
influence_radius_label.innerHTML = toFixed(influence_radius_slider.value * 0.001,0);

const gravity_slider = document.getElementById('gravity_slider');
const gravity_label = document.getElementById('gravity_label');
gravity_slider.min = 0;
gravity_slider.max = 1.5 * 1000;
gravity_slider.value = -gravity * 1000;
gravity_slider.width = pixels(slider_width);
gravity_slider.left = pixels(slider_dx);
gravity_slider.bottom = pixels(top_spacing * 2 + slider_dy);
gravity_label.left = pixels(slider_dx + slider_width * 0.5);
gravity_label.bottom = pixels(top_spacing * 2 + slider_dy + label_dy);
gravity_label.innerHTML = toFixed(gravity_slider.value * 0.001, 3);

const target_density_slider = document.getElementById('target_density_slider');
const target_density_label = document.getElementById('target_density_label');
target_density_slider.min = 0;
target_density_slider.max = 15 * 1000;
target_density_slider.value = target_density * 1000;
target_density_slider.width = pixels(slider_width);
target_density_slider.left = pixels(slider_dx);
target_density_slider.bottom = pixels(top_spacing * 3 + slider_dy);
target_density_label.left = pixels(slider_dx + slider_width * 0.5);
target_density_label.bottom = pixels(top_spacing * 3 + slider_dy + label_dy);
target_density_label.innerHTML = toFixed(target_density_slider.value * 0.001, 3);

const pressure_multiplier_slider = document.getElementById('pressure_multiplier_slider');
const pressure_multiplier_label = document.getElementById('pressure_multiplier_label');
pressure_multiplier_slider.min = 0.001 * 1000; 
pressure_multiplier_slider.max = 2.5 * 1000;
pressure_multiplier_slider.value = pressure_multiplier * 1000;
pressure_multiplier_slider.width = pixels(slider_width);
pressure_multiplier_slider.left = pixels(slider_dx);
pressure_multiplier_slider.bottom = pixels(top_spacing * 4 + slider_dy);
pressure_multiplier_label.left = pixels(slider_dx + slider_width * 0.5);
pressure_multiplier_label.bottom = pixels(top_spacing * 4 + slider_dy + label_dy);
pressure_multiplier_label.innerHTML = toFixed(pressure_multiplier_slider.value * 0.001, 3);

const viscosity_multiplier_slider = document.getElementById('viscosity_multiplier_slider');
const viscosity_multipler_label = document.getElementById('viscosity_multiplier_label');
viscosity_multiplier_slider.min = 0;
viscosity_multiplier_slider.max = 1 * 1000;
viscosity_multiplier_slider.value = viscosity_multipler * 1000;
viscosity_multiplier_slider.width = pixels(slider_width);
viscosity_multiplier_slider.left = pixels(slider_dx);
viscosity_multiplier_slider.bottom = pixels(top_spacing * 5 + slider_dy);
viscosity_multipler_label.left = pixels(slider_dx + slider_width * 0.5);
viscosity_multipler_label.bottom = pixels(top_spacing * 5 + slider_dy + label_dy);
viscosity_multipler_label.innerHTML = toFixed(viscosity_multiplier_slider.value * 0.001, 3);

const surface_tension_slider = document.getElementById('surface_tension_slider');
const surface_tension_label = document.getElementById('surface_tension_label');
surface_tension_slider.min = 0;
surface_tension_slider.max = 10 * 1000;
surface_tension_slider.value = surface_tension_mp * 1000;
surface_tension_slider.width = pixels(slider_width);
surface_tension_slider.left = pixels(slider_dx);
surface_tension_slider.bottom = pixels(top_spacing * 6 + slider_dy);
surface_tension_label.left = pixels(slider_dx + slider_width * 0.5);
surface_tension_label.bottom = pixels(top_spacing * 6 + slider_dy + label_dy);
surface_tension_label.innerHTML = toFixed(surface_tension_slider.value * 0.001, 3);

const mouse_range_slider = document.getElementById('mouse_range_slider');
const mouse_range_label = document.getElementById('mouse_range_label');
mouse_range_slider.min = 20 * 1000;  
mouse_range_slider.max = 500 * 1000;
mouse_range_slider.value = mouse_influence_r * 1000;
mouse_range_slider.width = pixels(slider_width);
mouse_range_slider.left = pixels(slider_dx);
mouse_range_slider.bottom = pixels(top_spacing * 7 + slider_dy);
mouse_range_label.left = pixels(slider_dx + slider_width * 0.5);
mouse_range_label.bottom = pixels(top_spacing * 7 + slider_dy + label_dy);
mouse_range_label.innerHTML = toFixed(mouse_range_slider.value * 0.001, 3);

const mouse_strength_slider = document.getElementById('mouse_strength_slider');
const mouse_strength_label = document.getElementById('mouse_strength_label');
mouse_strength_slider.min = 0.01 * 1000;
mouse_strength_slider.max = 3 * 1000;
mouse_strength_slider.value = mouse_strength * 1000;
mouse_strength_slider.width = pixels(slider_width);
mouse_strength_slider.left = pixels(slider_dx);
mouse_strength_slider.bottom = pixels(top_spacing * 8 + slider_dy);
mouse_strength_label.left = pixels(slider_dx + slider_width * 0.5);
mouse_strength_label.bottom = pixels(top_spacing * 8 + slider_dy + label_dy);
mouse_strength_label.innerHTML = toFIxed(mouse_strength_slider.value * 0.001, 3);

particle_count_slider.oninput = function() {
    const value = particle_count_slider.value
    num_particles = value;
    particle_count_label.innerHTML = value;
}

influence_radius_slider.oninput = function() {
    const value = influence_radius_slider.value * 0.001;
    num_particles = value;
    influence_radius_label.innerHTML = toFixed(value, 3);
}

gravity_slider.oninput = function() {
    const value = gravity_slider.value * 0.001;
    num_particles = value;
    gravity_label.innerHTML = toFixed(value, 3);
}

target_density_slider.oninput = function() {
    const value = target_density_slider.value * 0.001;
    num_particles = value;
    target_density_label.innerHTML = toFixed(value, 3);
}

pressure_multiplier_slider.oninput = function() {
    const value = pressure_multiplier_slider.value * 0.001;
    num_particles = value;
    pressure_multiplier_label.innerHTML = toFixed(value, 3);
}

viscosity_multiplier_slider.oninput = function() {
    const value = viscosity_multiplier_slider.value * 0.001;
    num_particles = value;
    viscosity_multiplier_slider.innerHTML = toFixed(value, 3);
}

surface_tension_slider.oninput = function() {
    const value = surface_tension_slider.value * 0.001;
    num_particles = value;
    surface_tension_label.innerHTML = toFixed(value, 3);
}

mouse_range_slider.oninput = function() {
    const value = mouse_range_slider.value * 0.001;
    num_particles = value;
    mouse_range_label.innerHTML = toFixed(value, 3);
}

mouse_strength_slider.oninput = function() {
    const value = mouse_strength_slider.value * 0.001;
    num_particles = value;
    mouse_strength_label.innerHTML = toFixed(value, 3);
}