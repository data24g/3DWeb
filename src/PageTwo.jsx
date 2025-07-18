import React, { useRef, useEffect, useState, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Stars, OrbitControls, SpotLight, Torus, Billboard, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import HiModel from './Hi';

// --- Các component con (OrbitLine, PlanetLabel, Planet) giữ nguyên ---
function OrbitLine({ distance }) { return <Torus args={[distance, 0.02, 2, 128]} rotation-x={Math.PI / 2}><meshBasicMaterial color="#ffffff" transparent opacity={0.35} /></Torus>; }
const tempVector = new THREE.Vector3();
function PlanetLabel({ name }) { const textRef = useRef(); useFrame(state => { const parentPosition = textRef.current.parent.getWorldPosition(tempVector); const distance = parentPosition.distanceTo(state.camera.position); textRef.current.scale.set(distance * 0.05, distance * 0.05, distance * 0.05); }); return <Billboard position-y={1.2}><Text ref={textRef} fontSize={1} color="white" outlineColor="black" outlineWidth={0.05}>{name}</Text></Billboard>; }
const Planet = React.forwardRef(({ data, ...props }, ref) => { const { name, distance, speed, size, color, ring, initialAngleOffset } = data; useFrame(({ clock }) => { if (ref.current) { const t = (clock.getElapsedTime() * speed) + initialAngleOffset; ref.current.position.x = distance * Math.cos(t); ref.current.position.z = distance * Math.sin(t); } }); return (<group ref={ref} {...props}><Sphere args={[size, 32, 32]}><meshStandardMaterial color={color} /></Sphere>{ring && (<Torus args={[ring.innerRadius, ring.outerRadius - ring.innerRadius, 2, 64]} rotation={ring.rotation || [Math.PI / 2, 0, 0]}><meshStandardMaterial color={ring.color} side={THREE.DoubleSide} /></Torus>)}<PlanetLabel name={name} /></group>); });
Planet.displayName = 'Planet';


// --- Logic điều khiển (PlayerController) đã hoạt động đúng, không cần thay đổi ---
const PlayerController = React.forwardRef(({ keys, children, ...props }, ref) => {
    const speed = 25; const moveDirection = new THREE.Vector3(); const forwardVector = new THREE.Vector3(); const sideVector = new THREE.Vector3(); const targetQuaternion = new THREE.Quaternion();
    useFrame((state, delta) => {
        const player = ref.current; if (!player) return;
        state.camera.getWorldDirection(forwardVector); forwardVector.y = 0; forwardVector.normalize();
        sideVector.copy(forwardVector).cross(new THREE.Vector3(0, 1, 0));
        let horizontalMovement = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);
        let verticalMovement = (keys.current.forward ? 1 : 0) - (keys.current.backward ? 1 : 0);
        moveDirection.x = 0; moveDirection.y = 0; moveDirection.z = 0;
        moveDirection.add(forwardVector.clone().multiplyScalar(verticalMovement));
        moveDirection.add(sideVector.clone().multiplyScalar(horizontalMovement));
        if (moveDirection.lengthSq() > 0) {
            moveDirection.normalize();
            const targetAngle = Math.atan2(moveDirection.x, moveDirection.z);
            targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);
            player.quaternion.slerp(targetQuaternion, delta * 10);
        }
        player.position.add(moveDirection.multiplyScalar(delta * speed));
        if (keys.current.up) player.position.y += delta * (speed / 2);
        if (keys.current.down) player.position.y -= delta * (speed / 2);
    });
    return <group ref={ref} {...props}>{children}</group>;
});
PlayerController.displayName = 'PlayerController';

export function PageTwo({ setPage }) {
    // (Toàn bộ logic còn lại và JSX của PageTwo không có thay đổi lớn nào khác)
    const ufoRef = useRef(); const planetRefs = useRef([]); const controlsRef = useRef();
    const keys = useRef({ forward: false, backward: false, left: false, right: false, up: false, down: false });
    const [activePlanet, setActivePlanet] = useState(null);
    const planetsData = [{ name: "Mercury", distance: 30, speed: 0.2, size: 1.0, color: '#a9a9a9', url: '/mercury-info', initialAngleOffset: 0 }, { name: "Venus", distance: 45, speed: 0.12, size: 1.4, color: '#f0e68c', url: '/venus-info', initialAngleOffset: 1.2 }, { name: "Earth", distance: 60, speed: 0.09, size: 1.5, color: '#2e86de', url: '/earth-info', initialAngleOffset: 2.5 }, { name: "Mars", distance: 75, speed: 0.05, size: 1.2, color: '#c1440e', url: '/mars-info', initialAngleOffset: 4.0 }, { name: "Jupiter", distance: 90, speed: 0.025, size: 2.5, color: '#d2b48c', url: '/jupiter-info', initialAngleOffset: 0.5 }, { name: "Saturn", distance: 105, speed: 0.015, size: 2.2, color: '#f4d0a9', ring: { innerRadius: 3.0, outerRadius: 4.5, color: '#cba135' }, url: '/saturn-info', initialAngleOffset: 3.14 }, { name: "Uranus", distance: 120, speed: 0.007, size: 1.8, color: '#ace5ee', ring: { innerRadius: 2.2, outerRadius: 3.0, color: '#96d9f0', rotation: [0.5, 1, 0] }, url: '/uranus-info', initialAngleOffset: 5.2 }, { name: "Neptune", distance: 135, speed: 0.004, size: 1.7, color: '#364ed1', url: '/neptune-info', initialAngleOffset: 1.8 },];
    planetRefs.current = planetsData.map((_, i) => planetRefs.current[i] ?? React.createRef());
    useEffect(() => { const handleKey = (e, isDown) => { if (e.key.toLowerCase() === 'enter' && isDown && activePlanet) { alert(`Đã truy cập vào ${activePlanet.name}!`); return; } switch (e.key.toLowerCase()) { case 'w': keys.current.forward = isDown; break; case 's': keys.current.backward = isDown; break; case 'a': keys.current.left = isDown; break; case 'd': keys.current.right = isDown; break; case 'e': keys.current.up = isDown; break; case 'q': keys.current.down = isDown; break; } }; const downHandler = e => handleKey(e, true); const upHandler = e => handleKey(e, false); window.addEventListener('keydown', downHandler); window.addEventListener('keyup', upHandler); return () => { window.removeEventListener('keydown', downHandler); window.removeEventListener('keyup', upHandler); }; }, [activePlanet]);
    useFrame(() => { if (ufoRef.current && controlsRef.current) { controlsRef.current.target.lerp(ufoRef.current.position, 0.1); controlsRef.current.update(); } if (ufoRef.current) { let closestPlanet = null; let minDistance = Infinity; planetRefs.current.forEach((planetRef, index) => { if (planetRef.current) { const distance = ufoRef.current.position.distanceTo(planetRef.current.position); if (distance < minDistance) { minDistance = distance; closestPlanet = planetsData[index]; } } }); const interactionDistance = 10; if (minDistance < interactionDistance) { setActivePlanet(closestPlanet); } else { setActivePlanet(null); } } });

    return (
        <>
            <Html fullscreen>
                <div style={styles.instructions}><strong>Điều Khiển:</strong><br />W / S - Bay Tới / Lui<br />A / D - Bay Ngang Trái / Phải<br />E / Q - Bay Lên / Xuống<br />Chuột - Nhìn Xung Quanh<br />ENTER - Tương Tác</div>
                {activePlanet && <div style={styles.interactionPrompt}>Nhấn ENTER để khám phá {activePlanet.name}</div>}
            </Html>
            <OrbitControls ref={controlsRef} enableZoom enablePan={false} minDistance={10} maxDistance={200} />
            <Stars radius={400} depth={100} count={10000} factor={6} fade speed={1} />
            <ambientLight intensity={0.8} /> <directionalLight position={[10, 20, 5]} intensity={1.5} castShadow />
            <group><pointLight intensity={500} distance={400} color="#ffcc00" /><Sphere args={[15, 32, 32]}><meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={3} toneMapped={false} /></Sphere></group>
            {planetsData.map(planet => <OrbitLine key={`${planet.name}-orbit`} distance={planet.distance} />)}
            {planetsData.map((planet, index) => <Planet ref={planetRefs.current[index]} key={planet.name} data={planet} />)}

            <PlayerController ref={ufoRef} keys={keys} position={[0, 2, 80]}>
                <Suspense fallback={null}>
                    {/* === SỬA LỖI QUAN TRỌNG TẠI ĐÂY === */}
                    <HiModel
                        scale={0.4}
                        // BƯỚC 1: Xoay model để nó nằm ngang
                        rotation-x={-Math.PI / 2}
                    />
                    {/* BƯỚC 2: PlayerController sẽ lo phần tự động xoay theo hướng di chuyển */}
                </Suspense>
            </PlayerController>
        </>
    );
}

const styles = {
    interactionPrompt: { position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', padding: '12px 20px', backgroundColor: 'rgba(0, 0, 0, 0.6)', color: 'white', borderRadius: '8px', border: '1px solid white', fontFamily: 'sans-serif', fontSize: '16px', textAlign: 'center', zIndex: 100, pointerEvents: 'none', },
    instructions: { position: 'absolute', top: '20px', left: '20px', padding: '10px 15px', backgroundColor: 'rgba(0, 0, 0, 0.5)', color: 'white', borderRadius: '8px', fontFamily: 'sans-serif', fontSize: '14px', zIndex: 100, pointerEvents: 'none', lineHeight: '1.6', }
}