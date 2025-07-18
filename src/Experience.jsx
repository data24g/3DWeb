import { Text, Billboard, PresentationControls, Float, Stars, Sparkles } from '@react-three/drei';
import { CustomButton } from './CustomButton'; // Import nút tùy chỉnh

export default function Experience() {
    // Hàm xử lý khi nhấp vào nút
    const handleButtonClick = () => {
        alert("Button Clicked!");
        // Bạn có thể thay thế alert bằng logic chuyển trang nếu muốn
    };

    return (
        <PresentationControls
            global
            speed={1.5}
            zoom={0.8}
            rotation={[0, 0, 0]}
            polar={[-0.4, Math.PI / 2]}
            azimuth={[-1, Math.PI / 4]}
        >
            {/* HIỆU ỨNG VŨ TRỤ */}
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Sparkles count={100} scale={10} size={2} speed={0.4} />

            {/* CÁC NGUỒN SÁNG */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[1, 2, 3]} intensity={1.5} />

            {/* CHỮ "TRÌNH" */}
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

            {/* CHỮ "WELCOME" */}
            <Billboard>
                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.2}>
                    <Text position={[0, 2.5, 0]} fontSize={0.5} color="white" anchorX="center" anchorY="middle">
                        WELCOME TO MY SITE!
                    </Text>
                </Float>
            </Billboard>

            {/* NÚT 3D MỚI ĐÃ ĐƯỢC THÊM VÀO */}
            <CustomButton
                position={[0, -0.75, 3]}
                text="START"
                onClick={handleButtonClick}
            />

        </PresentationControls>
    );
}