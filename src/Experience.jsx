import { useRef, useEffect } from 'react';
import { Text, Billboard, Float, Stars, Sparkles, OrbitControls } from '@react-three/drei';
import { CustomButton } from './CustomButton';

// Trang này nhận `setPage` từ App.jsx để có thể ra lệnh chuyển trang
export default function Experience({ setPage }) {
    const sceneRef = useRef();

    return (
        <group ref={sceneRef}>
            <OrbitControls
                makeDefault
                enableZoom={true}
                minDistance={2}
                maxDistance={15}
                maxPolarAngle={Math.PI / 1.8}
                target={[0, 0.5, 0]}
            />
            <Stars radius={50} depth={30} count={2000} factor={3} fade speed={0.5} />
            <Sparkles count={50} scale={5} size={1} speed={0.2} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[1, 2, 3]} intensity={1.5} />

            <Billboard>
                <Float speed={1.5} rotationIntensity={1.5} floatIntensity={0.5}>
                    <Text
                        font="/fonts/Exile-Regular.ttf"
                        fontSize={1.5}
                        position-y={0.5}
                        bevelEnabled
                        bevelSize={0.05}
                        bevelThickness={0.1}
                    >
                        trình
                        <meshStandardMaterial
                            color="white"
                            emissive="white"
                            emissiveIntensity={1.8}
                            toneMapped={false}
                        />
                    </Text>
                </Float>
            </Billboard>

            <Billboard>
                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.2}>
                    <Text
                        position={[0, 2.5, 0]}
                        fontSize={0.5}
                        color="white"
                        anchorX="center"
                        anchorY="middle"
                    >
                        WELCOME TO MY SITE!
                    </Text>
                </Float>
            </Billboard>

            {/* ========================================================== */}
            {/* === THAY ĐỔI DUY NHẤT NẰM Ở ĐÂY === */}
            {/* ========================================================== */}
            <CustomButton
                position={[2.5, -0.5, 2]}
                text="START"
                // Trước đây, nó chuyển đến trang 3
                // onClick={() => setPage(3)}

                // Bây giờ, hãy đổi thành số 2 để chuyển đến Hệ Mặt Trời
                onClick={() => setPage(2)}
            />

            <group position={[3.5, -0.5, 2]}>
                <Float speed={4} rotationIntensity={0.1} floatIntensity={0.2}>
                    <Billboard>
                        <Text
                            position={[0, 0.8, 0]}
                            fontSize={0.3}
                            color="gold"
                            outlineColor="red"
                            outlineWidth={0.01}
                            textAlign="center"
                        >
                            Click me!
                        </Text>
                    </Billboard>
                </Float>
            </group>
        </group>
    );
}