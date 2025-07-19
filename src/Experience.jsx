import { useRef, useEffect } from 'react';
import { Text, Billboard, Float, Stars, Sparkles, OrbitControls } from '@react-three/drei';
import { CustomButton } from './CustomButton';

// Nhận isMobileView từ App.jsx
export default function Experience({ setPage, isMobileView }) {
    const sceneRef = useRef();

    useEffect(() => {
        const handleContextLost = (event) => {
            event.preventDefault();
            console.warn('WebGL context lost. Attempting to recover...');
        };

        const canvas = document.querySelector('canvas');
        if (canvas) { // Thêm kiểm tra để tránh lỗi nếu canvas chưa tồn tại
            canvas.addEventListener('webglcontextlost', handleContextLost);
            return () => {
                canvas.removeEventListener('webglcontextlost', handleContextLost);
            };
        }
    }, []);

    // ===== RESPONSIVE LOGIC =====
    // Định nghĩa vị trí và kích thước dựa trên isMobileView
    const titleFontSize = isMobileView ? 1.2 : 1.5;
    const welcomeFontSize = isMobileView ? 0.35 : 0.5;
    const welcomePosition = isMobileView ? [0, 1.8, 0] : [0, 2.5, 0];
    const buttonPosition = isMobileView ? [0, -1.2, 0] : [2.5, -0.5, 2];
    const clickMePosition = isMobileView ? [0, -0.4, 0] : [3.5, -0.5, 2];

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
                        fontSize={titleFontSize} // Sử dụng biến responsive
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
                        position={welcomePosition} // Sử dụng biến responsive
                        fontSize={welcomeFontSize} // Sử dụng biến responsive
                        color="white"
                        anchorX="center"
                        anchorY="middle"
                    >
                        WELCOME TO MY SITE!
                    </Text>
                </Float>
            </Billboard>

            <CustomButton
                position={buttonPosition} // Sử dụng biến responsive
                text="START"
                onClick={() => setPage(3)} // Sửa thành điều hướng đến trang 3 (TeamPage)
            />

            <group position={clickMePosition}> {/* Sử dụng biến responsive */}
                <Float speed={4} rotationIntensity={0.1} floatIntensity={0.2}>
                    <Billboard>
                        <Text
                            position-y={0.5}
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