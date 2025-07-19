import React, { useRef, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Stars, OrbitControls, Torus, Billboard, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Model as SpaceshipModel } from './Spaceship';

// --- Các component con khác giữ nguyên, không cần thay đổi ---
function OrbitLine({ distance }) { return <Torus args={[distance, 0.02, 2, 128]} rotation-x={Math.PI / 2}><meshBasicMaterial color="#ffffff" transparent opacity={0.35} /></Torus>; }
const tempVector = new THREE.Vector3();
function PlanetLabel({ name }) { const textRef = useRef(); useFrame(state => { const parentPosition = textRef.current.parent.getWorldPosition(tempVector); const distance = parentPosition.distanceTo(state.camera.position); textRef.current.scale.set(distance * 0.05, distance * 0.05, distance * 0.05); }); return <Billboard position-y={1.2}><Text ref={textRef} fontSize={1} color="white" outlineColor="black" outlineWidth={0.05}>{name}</Text></Billboard>; }
const Planet = React.forwardRef(({ data, ...props }, ref) => { const { name, distance, speed, size, color, ring, initialAngleOffset } = data; useFrame(({ clock }) => { if (ref.current) { const t = (clock.getElapsedTime() * speed) + initialAngleOffset; ref.current.position.x = distance * Math.cos(t); ref.current.position.z = distance * Math.sin(t); } }); return (<group ref={ref} {...props}><Sphere args={[size, 32, 32]}><meshStandardMaterial color={color} /></Sphere>{ring && (<Torus args={[ring.innerRadius, ring.outerRadius - ring.innerRadius, 2, 64]} rotation={ring.rotation || [Math.PI / 2, 0, 0]}><meshStandardMaterial color={ring.color} side={THREE.DoubleSide} /></Torus>)}<PlanetLabel name={name} /></group>); });
Planet.displayName = 'Planet';

// =======================================================================
// === PLAYER CONTROLLER ĐƯỢC CẬP NHẬT ĐỂ HỖ TRỢ JOYSTICK ===
// =======================================================================
const PlayerController = React.forwardRef(({ keys, joystickRef, children, ...props }, ref) => {
    const speed = 25;
    const moveDirection = new THREE.Vector3();
    const forwardVector = new THREE.Vector3();
    const sideVector = new THREE.Vector3();
    const targetQuaternion = new THREE.Quaternion();
    const boundaryRadius = 150;

    useFrame((state, delta) => {
        const player = ref.current;
        if (!player) return;

        state.camera.getWorldDirection(forwardVector);
        forwardVector.y = 0;
        forwardVector.normalize();
        sideVector.copy(forwardVector).cross(new THREE.Vector3(0, 1, 0));

        // Input từ Joystick
        const joystickX = joystickRef.current?.x || 0;
        const joystickY = joystickRef.current?.y || 0;
        const hasJoystickInput = joystickRef.current?.distance > 0;

        // Input từ Bàn phím
        const horizontalKeyboard = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);
        const verticalKeyboard = (keys.current.forward ? 1 : 0) - (keys.current.backward ? 1 : 0);

        // Ưu tiên input từ joystick nếu có
        const horizontalMovement = hasJoystickInput ? (joystickX / 50) : horizontalKeyboard;
        const verticalMovement = hasJoystickInput ? (joystickY / 50) : verticalKeyboard;

        moveDirection.set(0, 0, 0); // Reset

        if (hasJoystickInput) {
            // Xoay hướng di chuyển của joystick cho phù hợp với hướng camera
            const forward = forwardVector.clone().multiplyScalar(verticalMovement);
            const side = sideVector.clone().multiplyScalar(horizontalMovement);
            moveDirection.add(forward).add(side);
        } else {
            // Logic cũ cho bàn phím
            moveDirection.add(forwardVector.clone().multiplyScalar(verticalMovement));
            moveDirection.add(sideVector.clone().multiplyScalar(horizontalMovement));
        }

        // Logic giới hạn không gian
        const nextPosition = player.position.clone().add(moveDirection.normalize().multiplyScalar(delta * speed));
        if (nextPosition.length() < boundaryRadius) {
            player.position.copy(nextPosition);
        }

        // Logic xoay phi thuyền
        if (moveDirection.lengthSq() > 0) {
            const targetAngle = Math.atan2(moveDirection.x, moveDirection.z);
            targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);
            player.quaternion.slerp(targetQuaternion, delta * 10);
        }

        // Di chuyển lên/xuống vẫn bằng phím (hoặc bạn có thể thêm nút UI riêng)
        if (keys.current.up) player.position.y += delta * (speed / 2);
        if (keys.current.down) player.position.y -= delta * (speed / 2);
    });

    return <group ref={ref} {...props}>{children}</group>;
});
PlayerController.displayName = 'PlayerController';


// =======================================================================
// === COMPONENT CHÍNH PAGE TWO ĐƯỢC CẬP NHẬT ĐỂ NHẬN joystickRef ===
// =======================================================================
export function PageTwo({ setActivePlanet, joystickRef }) {
    const ufoRef = useRef();
    const planetRefs = useRef([]);
    const controlsRef = useRef();
    const keys = useRef({ forward: false, backward: false, left: false, right: false, up: false, down: false });
    const planetsData = [{ name: "Mercury", distance: 30, speed: 0.2, size: 1.0, color: '#a9a9a9', url: '/mercury-info', initialAngleOffset: 0 }, { name: "Venus", distance: 45, speed: 0.12, size: 1.4, color: '#f0e68c', url: '/venus-info', initialAngleOffset: 1.2 }, { name: "Earth", distance: 60, speed: 0.09, size: 1.5, color: '#2e86de', url: '/earth-info', initialAngleOffset: 2.5 }, { name: "Mars", distance: 75, speed: 0.05, size: 1.2, color: '#c1440e', url: '/mars-info', initialAngleOffset: 4.0 }, { name: "Jupiter", distance: 90, speed: 0.025, size: 2.5, color: '#d2b48c', url: '/jupiter-info', initialAngleOffset: 0.5 }, { name: "Saturn", distance: 105, speed: 0.015, size: 2.2, color: '#f4d0a9', ring: { innerRadius: 3.0, outerRadius: 4.5, color: '#cba135' }, url: '/saturn-info', initialAngleOffset: 3.14 }, { name: "Uranus", distance: 120, speed: 0.007, size: 1.8, color: '#ace5ee', ring: { innerRadius: 2.2, outerRadius: 3.0, color: '#96d9f0', rotation: [0.5, 1, 0] }, url: '/uranus-info', initialAngleOffset: 5.2 }, { name: "Neptune", distance: 135, speed: 0.004, size: 1.7, color: '#364ed1', url: '/neptune-info', initialAngleOffset: 1.8 },];

    planetRefs.current = planetsData.map((_, i) => planetRefs.current[i] ?? React.createRef());

    useEffect(() => {
        const handleKey = (e, isDown) => {
            switch (e.key.toLowerCase()) {
                case 'w': keys.current.forward = isDown; break;
                case 's': keys.current.backward = isDown; break;
                case 'a': keys.current.left = isDown; break;
                case 'd': keys.current.right = isDown; break;
                case 'e': keys.current.up = isDown; break;
                case 'q': keys.current.down = isDown; break;
            }
        };
        const downHandler = e => handleKey(e, true);
        const upHandler = e => handleKey(e, false);
        window.addEventListener('keydown', downHandler);
        window.addEventListener('keyup', upHandler);
        return () => {
            window.removeEventListener('keydown', downHandler);
            window.removeEventListener('keyup', upHandler);
        };
    }, []);

    useFrame(() => {
        if (ufoRef.current && controlsRef.current) {
            controlsRef.current.target.lerp(ufoRef.current.position, 0.1);
            controlsRef.current.update();
        }
        if (ufoRef.current) {
            let closestPlanet = null;
            let minDistance = Infinity;
            planetRefs.current.forEach((planetRef, index) => {
                if (planetRef.current) {
                    const distance = ufoRef.current.position.distanceTo(planetRef.current.position);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestPlanet = planetsData[index];
                    }
                }
            });
            const interactionDistance = 10;
            setActivePlanet(minDistance < interactionDistance ? closestPlanet : null);
        }
    });

    return (
        <>
            <OrbitControls
                ref={controlsRef}
                enableZoom
                enablePan={false}
                minDistance={10}
                maxDistance={200}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 2}
            />

            <Stars radius={400} depth={100} count={5000} factor={6} fade speed={1} />
            <ambientLight intensity={0.8} />
            <directionalLight position={[10, 20, 5]} intensity={1.5} castShadow />
            <group>
                <pointLight intensity={500} distance={400} color="#ffcc00" />
                <Sphere args={[15, 32, 32]}>
                    <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={3} toneMapped={false} />
                </Sphere>
            </group>

            {planetsData.map(planet => <OrbitLine key={`${planet.name}-orbit`} distance={planet.distance} />)}
            {planetsData.map((planet, index) => <Planet ref={planetRefs.current[index]} key={planet.name} data={planet} />)}

            <PlayerController ref={ufoRef} keys={keys} joystickRef={joystickRef} position={[0, 2, 80]}>
                <Suspense fallback={null}>
                    <SpaceshipModel scale={2.5} rotation-y={Math.PI} />
                </Suspense>
            </PlayerController>
        </>
    );
}