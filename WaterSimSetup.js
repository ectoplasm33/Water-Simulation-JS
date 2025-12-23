function pixels(value) {
    return String(value) + "px";
}

export let num_particles = 3800;
export let max_particles = 12000;
export let influence_radius = 48.0;
export let target_density  = 6.5;
export let pressure_multiplier = 0.16;
export let viscosity_multipler = 0.13;
export let surface_tension_mp = 1.0;
export let gravity = -0.25;

export let h_sq = influence_radius * influence_radius;
export let repulsion_radius = 0.5 * influence_radius;
export let inv_rep_r = 1.0 / repulsion_radius;
export let inv_h = 1.0 / influence_radius;
export let cell_size = influence_radius;
export let inv_cs = 1.0 / cell_size;

export const target_fps = 120;
export const delay = 1000.0 / target_fps;

export let mouse_strength = .6;
let mouse_influence_r = 250.0;
export let mouse_r2 = mouse_influence_r * mouse_influence_r;

export let lmb = false;
export let rmb = false;

export let mouse_x = -1e5;
export let mouse_y = -1e5;

export let render_colors = false;
export let show_ui = false;
export let show_fps = false;

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
influence_radius_label.innerHTML = String(toFixed(Number(influence_radius_slider.value) * 0.001,0));

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
gravity_label.innerHTML = String(toFixed(Number(gravity_slider.value) * 0.001, 3));

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
target_density_label.innerHTML = String(toFixed(Number(target_density_slider.value) * 0.001, 3));

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
pressure_multiplier_label.innerHTML = String(toFixed(Number(pressure_multiplier_slider.value) * 0.001, 3));

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
viscosity_multipler_label.innerHTML = String(toFixed(Number(viscosity_multiplier_slider.value) * 0.001, 3));

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
surface_tension_label.innerHTML = String(toFixed(Number(surface_tension_slider.value) * 0.001, 3));

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
mouse_range_label.innerHTML = String(toFixed(Number(mouse_range_slider.value) * 0.001, 3));

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
mouse_strength_label.innerHTML = String(toFIxed(Number(mouse_strength_slider.value) * 0.001, 3));

particle_count_slider.oninput = function() {
    const value = Number(particle_count_slider.value)
    num_particles = value;
    particle_count_label.innerHTML = String(value);
}

influence_radius_slider.oninput = function() {
    const value = Number(influence_radius_slider.value) * 0.001;
    influence_radius = value;
    h_sq = influence_radius * influence_radius;
    inv_h = 1.0 / influence_radius;
    repulsion_radius = influence_radius * 0.5;
    inv_rep_r = 1.0 / repulsion_radius;
    cell_size = influence_radius;
    inv_cs = inv_h;
    influence_radius_label.innerHTML = String(toFixed(value, 3));
}

gravity_slider.oninput = function() {
    const value = Number(gravity_slider.value) * 0.001;
    gravity = value;
    gravity_label.innerHTML = String(toFixed(value, 3));
}

target_density_slider.oninput = function() {
    const value = Number(target_density_slider.value) * 0.001;
    target_density = value;
    target_density_label.innerHTML = String(toFixed(value, 3));
}

pressure_multiplier_slider.oninput = function() {
    const value = Number(pressure_multiplier_slider.value) * 0.001;
    pressure_multiplier = value;
    pressure_multiplier_label.innerHTML = String(toFixed(value, 3));
}

viscosity_multiplier_slider.oninput = function() {
    const value = Number(viscosity_multiplier_slider.value) * 0.001;
    viscosity_multipler = value;
    viscosity_multiplier_slider.innerHTML = String(toFixed(value, 3));
}

surface_tension_slider.oninput = function() {
    const value = Number(surface_tension_slider.value) * 0.001;
    surface_tension_mp = value;
    surface_tension_label.innerHTML = String(toFixed(value, 3));
}

mouse_range_slider.oninput = function() {
    const value = Number(mouse_range_slider.value) * 0.001;
    mouse_influence_r = value;
    mouse_r2 = mouse_influence_r * mouse_influence_r;
    mouse_range_label.innerHTML = String(toFixed(value, 3));
}

mouse_strength_slider.oninput = function() {
    const value = Number(mouse_strength_slider.value) * 0.001;
    mouse_strength = value;
    mouse_strength_label.innerHTML = String(toFixed(value, 3));
}