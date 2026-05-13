"use client";
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface StarFieldProps {
  reduced?: boolean;
}

const StarField: React.FC<StarFieldProps> = ({ reduced = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) {
      console.warn('[StarField] Container ref is null');
      return;
    }
    
    console.log('[StarField] Starting initialization');
    
    // --- Setup ---
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020205, 0.0008);
    
    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 4000);
    camera.position.z = 1000;
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, true);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.pointerEvents = 'none';
    renderer.domElement.style.zIndex = '0';
    containerRef.current.appendChild(renderer.domElement);
    console.log('[StarField] Canvas appended:', {
      canvasSize: `${renderer.domElement.width}x${renderer.domElement.height}`,
      domSize: `${containerRef.current.clientWidth}x${containerRef.current.clientHeight}`
    });
    
    // --- Textures ---
    const parseTexture = () => {
       const canvas = document.createElement("canvas");
       canvas.width = 128; canvas.height = 128;
       const ctx = canvas.getContext("2d")!;
       const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
       grad.addColorStop(0, "rgba(255,255,255,1)");
       grad.addColorStop(0.3, "rgba(220,220,220,0.8)");
       grad.addColorStop(0.7, "rgba(200,200,200,0.3)");
       grad.addColorStop(1, "rgba(0,0,0,0)");
       ctx.fillStyle = grad;
       ctx.fillRect(0,0,128,128);
       return new THREE.CanvasTexture(canvas);
    };
    const circleTexture = parseTexture();

    // --- Neural Network Nodes & Connections ---
    const nodeCount = reduced ? 150 : 400;
    const positions = new Float32Array(nodeCount * 3);
    const originalPositions = new Float32Array(nodeCount * 3);
    const velocities = new Float32Array(nodeCount * 3);
    const phases = new Float32Array(nodeCount);
    const colors = new Float32Array(nodeCount * 3);
    const scales = new Float32Array(nodeCount);

    const colorChoices = [
        new THREE.Color(0xffffff), // White
        new THREE.Color(0xe0e0e0)  // Light gray
    ];
    
    for(let i=0; i<nodeCount; i++) {
        // Distribute in a focused sphere with some periphery
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = Math.random() < 0.7 ? Math.cbrt(Math.random()) * 800 : Math.cbrt(Math.random()) * 1400 + 200;

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi) * 0.7;
        
        positions[i*3] = x;
        positions[i*3+1] = y;
        positions[i*3+2] = z;
        
        originalPositions[i*3] = x;
        originalPositions[i*3+1] = y;
        originalPositions[i*3+2] = z;
        
        velocities[i*3] = (Math.random() - 0.5) * 0.8;
        velocities[i*3+1] = (Math.random() - 0.5) * 0.8;
        velocities[i*3+2] = (Math.random() - 0.5) * 0.8;
        
        phases[i] = Math.random() * Math.PI * 2;
        
        const c = colorChoices[Math.floor(Math.random() * colorChoices.length)];
        // Bright white, minimal variation
        const intensity = 0.9 + Math.random() * 0.2;
        colors[i*3] = c.r * intensity;
        colors[i*3+1] = c.g * intensity;
        colors[i*3+2] = c.b * intensity;

        scales[i] = Math.random() > 0.85 ? 3.5 : Math.random() * 2.5 + 1.2;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const pointsMaterial = new THREE.PointsMaterial({
        size: 3,
        map: circleTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true,
        opacity: 0.95,
        sizeAttenuation: true
    });
    
    const points = new THREE.Points(geometry, pointsMaterial);
    scene.add(points);
    
    // Lines
    const lineMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.35,
        linewidth: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const lineGeometry = new THREE.BufferGeometry();
    const maxLines = nodeCount * 30; // Estimate 30 connections per node max
    const linePositions = new Float32Array(maxLines * 6); 
    const lineColors = new Float32Array(maxLines * 6);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // --- Floating Geometry Fragments ---
    const fragments = new THREE.Group();
    for(let i=0; i < (reduced ? 0 : 0); i++) {
        const geom = Math.random() > 0.5 ? new THREE.TetrahedronGeometry(Math.random()*40 + 10) : new THREE.OctahedronGeometry(Math.random()*30 + 10);
        const mat = new THREE.MeshBasicMaterial({ 
            color: colorChoices[Math.floor(Math.random()*colorChoices.length)], 
            wireframe: true, 
            transparent: true, 
            opacity: 0.05, 
            blending: THREE.AdditiveBlending 
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set((Math.random()-0.5)*3000, (Math.random()-0.5)*2000, (Math.random()-0.5)*2000);
        mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
        mesh.userData = {
            rx: (Math.random()-0.5)*0.01,
            ry: (Math.random()-0.5)*0.01,
            vz: (Math.random()-0.5)*2
        };
        fragments.add(mesh);
    }
    scene.add(fragments);
    
    // --- Interaction ---
    const mouse = new THREE.Vector2(-9999, -9999);
    const targetMouse = new THREE.Vector2(-9999, -9999);
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0,0,1), 0);
    const mousePos3D = new THREE.Vector3(-9999, -9999, 0);
    const smoothMouse = new THREE.Vector3(-9999, -9999, 0);
    
    let shockwaves: { center: THREE.Vector3, time: number, maxRadius: number }[] = [];

    const onMouseMove = (e: MouseEvent) => {
        targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    
    const onClick = () => {
        if(smoothMouse.z !== -9999) {
            shockwaves.push({ center: smoothMouse.clone(), time: 0, maxRadius: 400 });
            renderer.setClearColor(0x0a0a0a, 0.15);
        }
    };
    
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('click', onClick);
    window.addEventListener('touchstart', (e) => {
        if(e.touches.length > 0) {
            targetMouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
            targetMouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
        }
    }, { passive: true });
    
    const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    
    let time = 0;
    let animationFrame: number;
    const connectionDistSq = reduced ? 15000 : 22000;
    
    const animate = () => {
        animationFrame = requestAnimationFrame(animate);
        time += 0.005;
        
        mouse.lerp(targetMouse, 0.05);
        if(targetMouse.x !== -9999) {
            raycaster.setFromCamera(mouse, camera);
            raycaster.ray.intersectPlane(plane, mousePos3D);
            if(smoothMouse.z === -9999) smoothMouse.copy(mousePos3D);
            smoothMouse.lerp(mousePos3D, 0.1);
        }

        // Recover clear color slowly
        const currentAlpha = renderer.getClearAlpha();
        if(currentAlpha > 0.01) {
            const newAlpha = currentAlpha * 0.95;
            renderer.setClearColor(0x1a2b4c, newAlpha);
        } else {
            renderer.setClearColor(0x000000, 0);
        }
        
        for(let i=shockwaves.length-1; i>=0; i--) {
            shockwaves[i].time += 25;
            if(shockwaves[i].time > shockwaves[i].maxRadius) {
                shockwaves.splice(i, 1);
            }
        }
        
        let lineIndex = 0;
        let colorIndex = 0;
        const posAttr = geometry.attributes.position;
        const colAttr = geometry.attributes.color;
        const lPosAttr = lineGeometry.attributes.position;
        const lColAttr = lineGeometry.attributes.color;
        
        // Parallax camera - subtle
        camera.position.x += (mouse.x * 100 - camera.position.x) * 0.01;
        camera.position.y += (mouse.y * 100 - camera.position.y) * 0.01;
        camera.lookAt(scene.position);
        fragments.rotation.y = time * 0.5;
        fragments.rotation.x = Math.sin(time) * 0.2;
        
        for(let i=0; i<nodeCount; i++) {
            let px = originalPositions[i*3];
            let py = originalPositions[i*3+1];
            let pz = originalPositions[i*3+2];
            
            // Base drift - very subtle
            px += Math.sin(time * 0.8 + phases[i]) * 15;
            py += Math.cos(time * 0.6 + phases[i]) * 15;
            pz += Math.sin(time * 0.5 + phases[i]) * 12;
            
            // Mouse repel / attract - subtle
            if(smoothMouse.z !== -9999) {
                const dx = px - smoothMouse.x;
                const dy = py - smoothMouse.y;
                const distSq = dx*dx + dy*dy;
                if(distSq < 150000) {
                    const force = (150000 - distSq) / 150000;
                    px -= dx * force * 0.15;
                    py -= dy * force * 0.15;
                    pz += force * 80;
                }
            }
            
            // Shockwaves
            shockwaves.forEach(sw => {
                const dx = px - sw.center.x;
                const dy = py - sw.center.y;
                const dz = pz - sw.center.z;
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                const waveDist = Math.abs(dist - sw.time);
                if(waveDist < 60) {
                    const force = (60 - waveDist)/60;
                    px += (dx/dist) * force * 40;
                    py += (dy/dist) * force * 40;
                    pz += (dz/dist) * force * 40;
                }
            });
            
            posAttr.setXYZ(i, px, py, pz);
            
            // Connections
            for(let j=i+1; j<nodeCount; j++) {
                // Only consider nodes relative to each other's base distance to save CPU
                const bx = originalPositions[i*3] - originalPositions[j*3];
                const by = originalPositions[i*3+1] - originalPositions[j*3+1];
                const bz = originalPositions[i*3+2] - originalPositions[j*3+2];
                if(bx*bx + by*by + bz*bz > connectionDistSq * 3) continue;

                const px2 = originalPositions[j*3] + Math.sin(time * 0.8 + phases[j])*15;
                const py2 = originalPositions[j*3+1] + Math.cos(time * 0.6 + phases[j])*15;
                const pz2 = originalPositions[j*3+2] + Math.sin(time * 0.5 + phases[j])*12;
                
                // Actual current distance
                let cx2 = px2; let cy2 = py2; let cz2 = pz2;
                
                // apply mouse and shockwave roughly to j to find real dist
                if(smoothMouse.z !== -9999) {
                    const mdx = cx2 - smoothMouse.x, mdy = cy2 - smoothMouse.y;
                    const mds = mdx*mdx + mdy*mdy;
                    if(mds < 150000) {
                        const mfr = (150000 - mds) / 150000;
                        cx2 -= mdx * mfr * 0.15; cy2 -= mdy * mfr * 0.15; cz2 += mfr * 80;
                    }
                }
                shockwaves.forEach(sw => {
                    const dx = cx2 - sw.center.x, dy = cy2 - sw.center.y, dz = cz2 - sw.center.z;
                    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                    const wd = Math.abs(dist - sw.time);
                    if(wd < 60) {
                        const fr = (60 - wd)/60;
                        cx2 += (dx/dist)*fr*40; cy2 += (dy/dist)*fr*40; cz2 += (dz/dist)*fr*40;
                    }
                });

                const dxx = px - cx2, dyy = py - cy2, dzz = pz - cz2;
                const distSq = dxx*dxx + dyy*dyy + dzz*dzz;
                
                if(distSq < connectionDistSq && lineIndex < maxLines * 2) {
                    lPosAttr.setXYZ(lineIndex, px, py, pz);
                    lColAttr.setXYZ(lineIndex, colAttr.getX(i), colAttr.getY(i), colAttr.getZ(i));
                    lineIndex++;
                    
                    lPosAttr.setXYZ(lineIndex, cx2, cy2, cz2);
                    lColAttr.setXYZ(lineIndex, colAttr.getX(j), colAttr.getY(j), colAttr.getZ(j));
                    lineIndex++;
                }
            }
        }
        posAttr.needsUpdate = true;
        lPosAttr.needsUpdate = true;
        lColAttr.needsUpdate = true;
        lineGeometry.setDrawRange(0, lineIndex);
        
        // Fragments
        fragments.children.forEach(c => {
            c.rotation.x += c.userData.rx;
            c.rotation.y += c.userData.ry;
            c.position.z += c.userData.vz;
            if(c.position.z > 1000) c.position.z = -2000;
            if(c.position.z < -2000) c.position.z = 1000;
        });
        
        renderer.render(scene, camera);
    };
    
    animate();
    
    return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('click', onClick);
        window.removeEventListener('resize', onResize);
        cancelAnimationFrame(animationFrame);
        renderer.dispose();
        geometry.dispose();
        lineGeometry.dispose();
        pointsMaterial.dispose();
        lineMaterial.dispose();
        circleTexture.dispose();
        if(containerRef.current?.contains(renderer.domElement)) {
            containerRef.current.removeChild(renderer.domElement);
        }
    };
  }, [reduced]);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 top-0 left-0" 
      style={{ 
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'block'
      }} 
    />
  );
};

export default StarField;
