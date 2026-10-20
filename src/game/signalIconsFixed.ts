import { lighten, type IconDrawer } from './signalIconsAi';

export const FIXED_AND_MANUAL_DRAWERS: Record<string, IconDrawer> = {
    // Microwave timer: microwave body with glass door and digital 7-segment clock
    microwave: (g, s, c) => {
        const w = s * 0.74;
        const h = s * 0.48;
        g.fillStyle(c, 0.16).fillRoundedRect(-w / 2, -h / 2, w, h, 8);
        g.lineStyle(3, c, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
        g.lineStyle(2, c, 0.8).strokeRoundedRect(-w * 0.44, -h * 0.38, w * 0.54, h * 0.76, 4);
        g.lineStyle(1.5, c, 0.5).lineBetween(-w * 0.38, h * 0.26, -w * 0.02, h * 0.26);
        g.fillStyle(lighten(c, 40), 1).fillRect(w * 0.18, -h * 0.34, w * 0.24, h * 0.26);
        g.fillStyle(lighten(c, 20), 1).fillCircle(w * 0.3, h * 0.12, s * 0.06);
    },

    // Automatic door sensor: double glass doors with overhead sensor waves
    door: (g, s, c) => {
        const w = s * 0.62;
        const h = s * 0.62;
        g.fillStyle(lighten(c, 30), 1).fillRoundedRect(-w * 0.2, -h * 0.55, w * 0.4, s * 0.08, 3);
        g.lineStyle(1.5, lighten(c, 40), 0.5);
        g.lineBetween(-w * 0.15, -h * 0.45, -w * 0.45, -h * 0.15);
        g.lineBetween(w * 0.15, -h * 0.45, w * 0.45, -h * 0.15);
        g.lineStyle(2.5, c, 1);
        g.strokeRect(-w * 0.48, -h * 0.2, w * 0.44, h * 0.65);
        g.strokeRect(w * 0.04, -h * 0.2, w * 0.44, h * 0.65);
        g.lineStyle(2, lighten(c, 50), 0.9);
        g.lineBetween(-w * 0.16, h * 0.1, -w * 0.36, h * 0.1);
        g.lineBetween(w * 0.16, h * 0.1, w * 0.36, h * 0.1);
    },

    // Washing machine: washer housing with circular glass porthole
    washer: (g, s, c) => {
        const w = s * 0.58;
        const h = s * 0.68;
        g.fillStyle(c, 0.14).fillRoundedRect(-w / 2, -h / 2, w, h, 8);
        g.lineStyle(3, c, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
        g.lineStyle(1.5, c, 0.6).lineBetween(-w / 2, -h * 0.28, w / 2, -h * 0.28);
        g.fillStyle(lighten(c, 40), 1).fillCircle(w * 0.25, -h * 0.38, 4);
        g.fillRect(-w * 0.38, -h * 0.42, w * 0.4, 6);
        g.lineStyle(2.5, c, 0.9).strokeCircle(0, h * 0.12, w * 0.32);
        g.lineStyle(1.5, lighten(c, 30), 0.6).strokeCircle(0, h * 0.12, w * 0.2);
    },

    // Streetlight: curved lamppost with illuminated downward beam
    streetlight: (g, s, c) => {
        g.lineStyle(3, c, 1);
        g.beginPath();
        g.moveTo(-s * 0.15, s * 0.38);
        g.lineTo(-s * 0.15, -s * 0.2);
        g.arc(-s * 0.02, -s * 0.2, s * 0.13, Math.PI, 0, false);
        g.lineTo(s * 0.11, -s * 0.08);
        g.strokePath();
        g.fillStyle(lighten(c, 45), 1).fillRoundedRect(s * 0.03, -s * 0.08, s * 0.16, s * 0.08, 3);
        g.fillStyle(lighten(c, 50), 0.2);
        g.beginPath();
        g.moveTo(s * 0.05, 0);
        g.lineTo(s * 0.17, 0);
        g.lineTo(s * 0.32, s * 0.38);
        g.lineTo(-s * 0.05, s * 0.38);
        g.closePath().fillPath();
    },

    // Bicycle: two spoked wheels, frame diamond, handlebar and pedal
    bicycle: (g, s, c) => {
        const wr = s * 0.18;
        g.lineStyle(2.5, c, 1).strokeCircle(-s * 0.25, s * 0.15, wr);
        g.strokeCircle(s * 0.25, s * 0.15, wr);
        g.lineStyle(1, lighten(c, 30), 0.5);
        g.lineBetween(-s * 0.25, s * 0.15 - wr, -s * 0.25, s * 0.15 + wr);
        g.lineBetween(-s * 0.25 - wr, s * 0.15, -s * 0.25 + wr, s * 0.15);
        g.lineBetween(s * 0.25, s * 0.15 - wr, s * 0.25, s * 0.15 + wr);
        g.lineStyle(2.5, lighten(c, 30), 1);
        g.beginPath();
        g.moveTo(-s * 0.25, s * 0.15);
        g.lineTo(-s * 0.08, -s * 0.1);
        g.lineTo(s * 0.15, -s * 0.12);
        g.lineTo(s * 0.25, s * 0.15);
        g.moveTo(s * 0.15, -s * 0.12);
        g.lineTo(0, s * 0.15);
        g.lineTo(-s * 0.25, s * 0.15);
        g.moveTo(0, s * 0.15);
        g.lineTo(-s * 0.08, -s * 0.1);
        g.strokePath();
        g.lineStyle(2, lighten(c, 50), 1).lineBetween(s * 0.11, -s * 0.18, s * 0.18, -s * 0.18);
    },

    // Pencil sharpener: desk rotary sharpener with hand crank
    sharpener: (g, s, c) => {
        const w = s * 0.48;
        const h = s * 0.54;
        g.fillStyle(c, 0.2).fillRoundedRect(-w * 0.4, -h * 0.45, w * 0.7, h * 0.85, 6);
        g.lineStyle(2.5, c, 1).strokeRoundedRect(-w * 0.4, -h * 0.45, w * 0.7, h * 0.85, 6);
        g.fillStyle(lighten(c, 40), 1).fillCircle(-w * 0.05, -h * 0.15, s * 0.08);
        g.lineStyle(3, lighten(c, 30), 1);
        g.beginPath();
        g.moveTo(w * 0.3, -h * 0.1);
        g.lineTo(w * 0.5, -h * 0.1);
        g.lineTo(w * 0.5, -h * 0.35);
        g.strokePath();
        g.fillStyle(lighten(c, 50), 1).fillCircle(w * 0.5, -h * 0.35, 5);
    },

    // Paper map: 3-panel folded tactical map with compass needle
    map: (g, s, c) => {
        const w = s * 0.65;
        const h = s * 0.52;
        g.fillStyle(c, 0.15);
        g.lineStyle(2.5, c, 1);
        [[-w * 0.45, -w * 0.15, -h * 0.05], [-w * 0.15, w * 0.15, h * 0.05], [w * 0.15, w * 0.45, -h * 0.05]].forEach(([x1, x2, dy]) => {
            g.beginPath();
            g.moveTo(x1, -h * 0.45 + dy);
            g.lineTo(x2, -h * 0.45 - dy);
            g.lineTo(x2, h * 0.45 - dy);
            g.lineTo(x1, h * 0.45 + dy);
            g.closePath().fillPath().strokePath();
        });
        g.lineStyle(2, lighten(c, 45), 0.9);
        g.beginPath().moveTo(-w * 0.3, h * 0.2).lineTo(0, -h * 0.1).lineTo(w * 0.25, h * 0.15).strokePath();
        g.fillStyle(lighten(c, 60), 1).fillCircle(w * 0.25, h * 0.15, 4);
    },

    // Hand fan: folding handheld fan with radiating ribs
    fan: (g, s, c) => {
        const r = s * 0.4;
        g.fillStyle(c, 0.2);
        g.lineStyle(2.5, c, 1);
        g.beginPath();
        g.arc(0, s * 0.2, r, -Math.PI * 0.85, -Math.PI * 0.15, false);
        g.lineTo(0, s * 0.2);
        g.closePath().fillPath().strokePath();
        g.lineStyle(1.5, lighten(c, 35), 0.8);
        for (let a = -Math.PI * 0.8; a <= -Math.PI * 0.2; a += Math.PI * 0.15) {
            g.lineBetween(0, s * 0.2, Math.cos(a) * r, s * 0.2 + Math.sin(a) * r);
        }
        g.fillStyle(lighten(c, 50), 1).fillCircle(0, s * 0.2, 4);
    },

    // Calculator: LCD display with math symbols grid (+, -, ×, =)
    calculator: (g, s, c) => {
        const w = s * 0.54;
        const h = s * 0.7;
        g.fillStyle(c, 0.15).fillRoundedRect(-w / 2, -h / 2, w, h, 8);
        g.lineStyle(2.5, c, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
        g.fillStyle(lighten(c, 40), 0.9).fillRoundedRect(-w * 0.38, -h * 0.42, w * 0.76, h * 0.22, 4);
        g.fillStyle(c, 0.4);
        [[-w * 0.22, -h * 0.06], [w * 0.22, -h * 0.06], [-w * 0.22, h * 0.16], [w * 0.22, h * 0.16]].forEach(([bx, by]) => {
            g.fillRoundedRect(bx - 12, by - 8, 24, 16, 3);
        });
    },

    // Phone alarm: ringing alarm bell with sound vibrations
    alarm: (g, s, c) => {
        const r = s * 0.28;
        g.fillStyle(c, 0.15).fillCircle(0, s * 0.04, r);
        g.lineStyle(2.5, c, 1).strokeCircle(0, s * 0.04, r);
        g.lineStyle(2.5, lighten(c, 50), 1);
        g.lineBetween(0, s * 0.04, 0, s * 0.04 - r * 0.6);
        g.lineBetween(0, s * 0.04, r * 0.4, s * 0.04);
        g.lineStyle(2.5, c, 1);
        g.beginPath().arc(-r * 0.8, -r * 0.6, s * 0.1, Math.PI * 0.9, -Math.PI * 0.1, false).strokePath();
        g.beginPath().arc(r * 0.8, -r * 0.6, s * 0.1, -Math.PI * 0.9, Math.PI * 0.1, true).strokePath();
        g.lineBetween(-r * 0.6, s * 0.04 + r * 0.8, -r * 0.8, s * 0.04 + r);
        g.lineBetween(r * 0.6, s * 0.04 + r * 0.8, r * 0.8, s * 0.04 + r);
    },

    // Vending machine: glass cabinet with snacks, coil spirals, and keypad
    vending: (g, s, c) => {
        const w = s * 0.54;
        const h = s * 0.72;
        g.fillStyle(c, 0.15).fillRoundedRect(-w / 2, -h / 2, w, h, 8);
        g.lineStyle(2.5, c, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
        g.strokeRect(-w * 0.42, -h * 0.42, w * 0.54, h * 0.58);
        g.lineStyle(1.5, c, 0.5);
        g.lineBetween(-w * 0.42, -h * 0.16, w * 0.12, -h * 0.16);
        g.lineBetween(-w * 0.42, h * 0.06, w * 0.12, h * 0.06);
        g.fillStyle(lighten(c, 40), 1).fillRect(w * 0.22, -h * 0.3, w * 0.18, h * 0.18);
        g.lineStyle(2, c, 0.8).strokeRect(-w * 0.38, h * 0.24, w * 0.76, h * 0.14);
    },

    // Traffic light: rectangular casing with visor hoods and 3 signal lamps
    'traffic-light': (g, s, c) => {
        const w = s * 0.36;
        const h = s * 0.74;
        g.fillStyle(c, 0.2).fillRoundedRect(-w / 2, -h / 2, w, h, 8);
        g.lineStyle(2.5, c, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
        const lr = s * 0.09;
        [-h * 0.28, 0, h * 0.28].forEach((ly, i) => {
            g.lineStyle(1.5, lighten(c, 30), 0.7);
            g.beginPath().arc(0, ly, lr * 1.3, Math.PI, 0, false).strokePath();
            const lensColor = i === 0 ? 0xff6b6b : i === 1 ? 0xf0b429 : 0x4be39a;
            g.fillStyle(lensColor, 0.9).fillCircle(0, ly, lr);
        });
    },

    // Flashlight: knurled cylinder with reflector head and toggle switch
    flashlight: (g, s, c) => {
        g.lineStyle(2.5, c, 1);
        g.fillStyle(c, 0.2).fillRoundedRect(-s * 0.25, -s * 0.08, s * 0.34, s * 0.16, 4);
        g.strokeRoundedRect(-s * 0.25, -s * 0.08, s * 0.34, s * 0.16, 4);
        g.beginPath();
        g.moveTo(s * 0.09, -s * 0.08);
        g.lineTo(s * 0.25, -s * 0.18);
        g.lineTo(s * 0.28, s * 0.18);
        g.lineTo(s * 0.09, s * 0.08);
        g.closePath().fillPath().strokePath();
        g.fillStyle(lighten(c, 50), 0.25);
        g.beginPath();
        g.moveTo(s * 0.28, -s * 0.18);
        g.lineTo(s * 0.48, -s * 0.35);
        g.lineTo(s * 0.48, s * 0.35);
        g.lineTo(s * 0.28, s * 0.18);
        g.closePath().fillPath();
    },

    // Paper dictionary: thick open reference book with text lines
    dictionary: (g, s, c) => {
        const w = s * 0.7;
        const h = s * 0.5;
        g.fillStyle(c, 0.18);
        g.lineStyle(2.5, c, 1);
        g.beginPath();
        g.moveTo(0, h * 0.38);
        g.lineTo(-w * 0.45, h * 0.28);
        g.lineTo(-w * 0.45, -h * 0.38);
        g.lineTo(0, -h * 0.28);
        g.closePath().fillPath().strokePath();
        g.beginPath();
        g.moveTo(0, h * 0.38);
        g.lineTo(w * 0.45, h * 0.28);
        g.lineTo(w * 0.45, -h * 0.38);
        g.lineTo(0, -h * 0.28);
        g.closePath().fillPath().strokePath();
        g.lineStyle(1.5, lighten(c, 35), 0.6);
        [-0.15, -0.02, 0.11].forEach(dy => {
            g.lineBetween(-w * 0.38, dy * h, -w * 0.08, dy * h);
            g.lineBetween(w * 0.08, dy * h, w * 0.38, dy * h);
        });
    },

    // Smart speaker: mesh cylindrical tower with top illuminated LED ring
    speaker: (g, s, c) => {
        const w = s * 0.44;
        const h = s * 0.65;
        g.fillStyle(c, 0.16).fillRoundedRect(-w / 2, -h / 2, w, h, 10);
        g.lineStyle(2.5, c, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
        g.lineStyle(3, lighten(c, 50), 1).strokeEllipse(0, -h * 0.36, w * 0.75, s * 0.09);
        g.lineStyle(1, lighten(c, 25), 0.4);
        for (let y = -h * 0.18; y <= h * 0.36; y += 8) {
            g.lineBetween(-w * 0.38, y, w * 0.38, y);
        }
    },

    // Thermostat: circular digital climate dial with temperature arc and reading
    thermostat: (g, s, c) => {
        const r = s * 0.36;
        g.fillStyle(c, 0.15).fillCircle(0, 0, r);
        g.lineStyle(3, c, 1).strokeCircle(0, 0, r);
        g.lineStyle(4, lighten(c, 45), 0.9);
        g.beginPath().arc(0, 0, r * 0.75, Math.PI * 0.75, Math.PI * 2.25, false).strokePath();
        g.fillStyle(lighten(c, 60), 1).fillCircle(r * 0.65 * Math.cos(-0.3), r * 0.65 * Math.sin(-0.3), 5);
        g.lineStyle(2, lighten(c, 50), 1);
        g.lineBetween(-s * 0.06, 0, s * 0.06, 0);
        g.strokeCircle(s * 0.1, -s * 0.08, 3);
    },

    // Video game: ergonomic controller with D-pad, dual thumbsticks, and action buttons
    game: (g, s, c) => {
        const w = s * 0.72;
        const h = s * 0.46;
        g.fillStyle(c, 0.18).fillRoundedRect(-w / 2, -h / 2, w, h, 14);
        g.lineStyle(2.5, c, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
        const dx = -w * 0.26;
        g.fillStyle(lighten(c, 40), 1);
        g.fillRect(dx - 10, -3, 20, 6);
        g.fillRect(dx - 3, -10, 6, 20);
        const bx = w * 0.26;
        g.fillStyle(lighten(c, 45), 1);
        g.fillCircle(bx, -8, 4);
        g.fillCircle(bx, 8, 4);
        g.fillCircle(bx - 8, 0, 4);
        g.fillCircle(bx + 8, 0, 4);
        g.lineStyle(2, lighten(c, 30), 0.9);
        g.strokeCircle(-w * 0.1, h * 0.18, 7);
        g.strokeCircle(w * 0.1, h * 0.18, 7);
    },

    // Camera: camera chassis, top shutter & hot shoe, and multi-element lens
    camera: (g, s, c) => {
        const w = s * 0.68;
        const h = s * 0.48;
        g.fillStyle(c, 0.16).fillRoundedRect(-w / 2, -h * 0.38, w, h, 8);
        g.lineStyle(2.5, c, 1).strokeRoundedRect(-w / 2, -h * 0.38, w, h, 8);
        g.fillRoundedRect(-w * 0.2, -h * 0.58, w * 0.4, h * 0.24, 4);
        g.strokeRoundedRect(-w * 0.2, -h * 0.58, w * 0.4, h * 0.24, 4);
        g.lineStyle(3, c, 1).strokeCircle(0, h * 0.12, s * 0.19);
        g.lineStyle(2, lighten(c, 40), 0.85).strokeCircle(0, h * 0.12, s * 0.12);
        g.fillStyle(lighten(c, 50), 0.9).fillCircle(-s * 0.05, h * 0.12 - s * 0.05, 4);
    },

    // Car: aerodynamic vehicle profile with radar wave lines and wheels
    car: (g, s, c) => {
        const w = s * 0.74;
        const h = s * 0.38;
        g.fillStyle(c, 0.18);
        g.lineStyle(2.5, c, 1);
        g.beginPath();
        g.moveTo(-w * 0.48, h * 0.2);
        g.lineTo(-w * 0.46, -h * 0.05);
        g.lineTo(-w * 0.22, -h * 0.15);
        g.lineTo(-w * 0.06, -h * 0.48);
        g.lineTo(w * 0.22, -h * 0.48);
        g.lineTo(w * 0.38, -h * 0.05);
        g.lineTo(w * 0.48, h * 0.05);
        g.lineTo(w * 0.48, h * 0.2);
        g.closePath().fillPath().strokePath();
        g.fillStyle(0x07111e, 1);
        g.lineStyle(2.5, lighten(c, 30), 1);
        g.fillCircle(-w * 0.28, h * 0.25, s * 0.1).strokeCircle(-w * 0.28, h * 0.25, s * 0.1);
        g.fillCircle(w * 0.26, h * 0.25, s * 0.1).strokeCircle(w * 0.26, h * 0.25, s * 0.1);
        [w * 0.55, w * 0.65].forEach((rx, i) => {
            g.lineStyle(2, lighten(c, 40), 0.8 - i * 0.35);
            g.beginPath().arc(w * 0.4, h * 0.1, rx - w * 0.4, -0.4, 0.4, false).strokePath();
        });
    }
};
