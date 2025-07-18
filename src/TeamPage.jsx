import { PresentationControls, Float, Stars } from '@react-three/drei';
import { CustomButton } from './CustomButton';
import { MemberName } from './MemberName'; // Import component mới của chúng ta
import { Text } from '@react-three/drei'; // Vẫn cần Text cho các chữ khác

export function TeamPage({ setPage }) {

    const members = [
        "Lý Anh Huy",
        "Hờ Ngọc Sơn",
        "Vi Trọng Vũ",
        "Lê Vạn Trường Sơn",
        "Ngô Hữu Trường"
    ];
    const radius = 4;

    return (
        <PresentationControls
            global
            speed={1.5}
            zoom={0.7}
            polar={[-Math.PI / 4, Math.PI / 4]}
            azimuth={[-Math.PI / 4, Math.PI / 4]}
        >
            <Stars radius={100} depth={50} count={5000} factor={4} fade speed={1} />
            <ambientLight intensity={0.8} />
            <directionalLight position={[3, 5, 2]} intensity={2} />

            <CustomButton
                position={[0, 0, 0]}
                text=""
                onClick={() => setPage(1)}
            />

            <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.2}>
                <Text
                    position={[0, 2, 0]}
                    font="/fonts/Exile-Regular.ttf"
                    fontSize={1.0}
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

            <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.4}>
                <Text
                    position={[0, -2.2, 0]}
                    fontSize={0.65}
                    color="#FFD700"
                    emissive="#FFD700"
                    emissiveIntensity={3}
                    toneMapped={false}
                    anchorX="center"
                    outlineColor="white"
                    outlineWidth={0.02}
                >
                    Hãy vote cho chúng tôi
                </Text>
            </Float>

            {/* ---- SỬ DỤNG COMPONENT MỚI Ở ĐÂY ---- */}
            {members.map((name, index) => {
                const angle = (index / members.length) * Math.PI * 2;
                const x = radius * Math.cos(angle);
                const z = radius * Math.sin(angle);

                return (
                    <MemberName
                        key={index}
                        name={name}
                        position={[x, 0, z]}
                    />
                );
            })}

        </PresentationControls>
    );
}