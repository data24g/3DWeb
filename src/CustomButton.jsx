import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';

export function CustomButton({ position, text, onClick }) {
    const [hovered, setHover] = useState(false);
    const groupRef = useRef();
    const materialRef = useRef();

    // Sử dụng useFrame để tạo hiệu ứng mượt mà
    useFrame((state, delta) => {
        // Hiệu ứng phóng to khi hover
        const targetScale = hovered ? 1.1 : 1;
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

        // Hiệu ứng phát sáng khi hover
        const targetIntensity = hovered ? 1.5 : 0.5;
        materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
            materialRef.current.emissiveIntensity,
            targetIntensity,
            0.1
        );
    });

    return (
        <group
            ref={groupRef}
            position={position}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
            onClick={onClick}
            // Thêm dispose={null} để Drei không báo warning
            dispose={null}
        >
            {/* Thân nút */}
            <RoundedBox args={[2.5, 0.8, 0.2]} radius={0.15}>
                <meshStandardMaterial
                    ref={materialRef}
                    color="#2a004f"
                    emissive="#8a2be2" // Màu tím phát sáng
                    emissiveIntensity={0.5}
                    roughness={0.2}
                    metalness={0.8}
                    transparent
                    opacity={0.8}
                    toneMapped={false}
                />
            </RoundedBox>

            {/* Chữ trên nút */}
            <Text
                position={[0, 0, 0.15]}
                fontSize={0.25}
                color="white"
                font="/fonts/Exile-Regular.ttf"
            >
                {text}
            </Text>
        </group>
    );
}