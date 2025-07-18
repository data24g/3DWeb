import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Torus, Text } from '@react-three/drei';
import * as THREE from 'three';

export function CustomButton({ position, text, onClick }) {
    const [hovered, setHover] = useState(false);
    const groupRef = useRef();
    const ringRef = useRef(); // Ref cho đĩa bồi tụ

    useFrame((state, delta) => {
        // Hiệu ứng phóng to nhẹ khi hover
        const targetScale = hovered ? 1.2 : 1;
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

        // Đĩa bồi tụ xoay liên tục
        ringRef.current.rotation.z += delta * 0.7;
    });

    return (
        <group
            ref={groupRef}
            position={position}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
            onClick={onClick}
            dispose={null}
            // Giảm kích thước tổng thể của nút
            scale={0.7}
        >
            {/* Lõi đen - một quả cầu đen không phản chiếu ánh sáng */}
            <Sphere args={[0.6, 32, 32]}>
                <meshBasicMaterial color="black" />
            </Sphere>

            {/* Đĩa bồi tụ phát sáng */}
            <Torus ref={ringRef} args={[0.9, 0.05, 16, 100]} rotation-x={Math.PI * 0.5}>
                <meshStandardMaterial
                    color="#ff8c00" // Màu cam nóng
                    emissive="#ff8c00"
                    emissiveIntensity={hovered ? 8 : 4} // Sáng rực khi hover
                    toneMapped={false}
                />
            </Torus>

            {/* Chữ phát sáng ở trung tâm */}
            <Text
                position={[0, 0, 0]}
                fontSize={0.25}
                font="/fonts/Exile-Regular.ttf"
            >
                {text}
                <meshBasicMaterial color="white" toneMapped={false} />
            </Text>
        </group>
    );
}