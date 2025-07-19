import { PresentationControls, Float, Stars, Billboard } from '@react-three/drei'; // Thêm Billboard vào import
import { CustomButton } from './CustomButton';
import { MemberName } from './MemberName';
import { Text } from '@react-three/drei';

export function TeamPage({ setPage, isMobileView }) {

    const members = [
        "Lý Anh Huy",
        "Hờ Ngọc Sơn",
        "Vi Trọng Vũ",
        "Lê Vạn Trường Sơn",
        "Ngô Hữu Trường"
    ];

    // ===== RESPONSIVE LOGIC =====
    const radius = isMobileView ? 2.8 : 4;
    const titleFontSize = isMobileView ? 0.8 : 1.0;
    const voteFontSize = isMobileView ? 0.5 : 0.65;
    // Tách riêng vị trí của chữ "vote" để dễ quản lý
    const votePosition = isMobileView ? [0, -2.0, 0] : [0, -2.2, 0];

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

            {/* Nút quay lại trang 2 (Space ship) */}
            <CustomButton
                position={[0, 0, 0]}
                text="Back"
                onClick={() => setPage(2)}
            />

            <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.2}>
                <Text
                    position={[0, 2.2, 0]}
                    font="/fonts/Exile-Regular.ttf"
                    fontSize={titleFontSize}
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

            {/* ============================================== */}
            {/* === ÁP DỤNG HIỆU ỨNG CHO CHỮ "VOTE" Ở ĐÂY === */}
            {/* ============================================== */}
            <Billboard>
                <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.4}>
                    <Text
                        position={votePosition} // Sử dụng vị trí đã định nghĩa
                        fontSize={voteFontSize}
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
            </Billboard>

            {/* Component MemberName đã có sẵn Billboard và Float nên không cần thay đổi */}
            {members.map((name, index) => {
                const angle = (index / members.length) * Math.PI * 2;
                const x = radius * Math.cos(angle);
                const z = radius * Math.sin(angle);

                return (
                    <MemberName
                        key={index}
                        name={name}
                        position={[x, 0.2, z]}
                    />
                );
            })}

        </PresentationControls>
    );
}