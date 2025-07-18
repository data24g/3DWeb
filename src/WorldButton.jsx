import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';

// Component nút bấm 3D có thể tái sử dụng
export function WorldButton({ position, text, onClick }) {
    const [hovered, setHover] = useState(false);
    const buttonRef = useRef();

    // Sử dụng useFrame để tạo hiệu ứng mượt mà khi di chuột
    useFrame(() => {
        // Phóng to khi hover
        const targetScale = hovered ? 1.1 : 1;
        buttonRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    });

    return (
        <group
            position={position}
            ref={buttonRef}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
            onClick={onClick}
        >
            {/* Phần thân của nút */}
            <RoundedBox args={[2, 0.7, 0.5]} radius={0.15}>
                <meshStandardMaterial color={hovered ? '#6a5acd' : '#8a2be2'} />
            </RoundedBox>

            {/* Chữ trên nút */}
            <Text
                position={[0, 0, 0.3]}
                fontSize={0.25}
                color="white"
                anchorX="center"
                anchorY="middle"
            >
                {text}
            </Text>
        </group>
    );
}