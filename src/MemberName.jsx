import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard, Float } from '@react-three/drei';
import * as THREE from 'three';

const tempVector = new THREE.Vector3();

export function MemberName({ position, name }) {
    const groupRef = useRef();

    useFrame((state) => {
        if (!groupRef.current) return;
        const worldPosition = groupRef.current.getWorldPosition(tempVector);
        const distance = state.camera.position.distanceTo(worldPosition);
        const screenSpaceFactor = 0.05;
        const scale = distance * screenSpaceFactor;
        groupRef.current.scale.set(scale, scale, scale);
    });

    return (
        <Float speed={2} floatIntensity={0.1}>
            <Billboard ref={groupRef} position={position}>
                {/* 
                  Chúng ta sẽ tạo 2 lớp Text chồng lên nhau:
                  1. Lớp viền (lớn hơn một chút) ở phía sau.
                  2. Lớp chữ chính ở phía trước.
                  Điều này tạo ra hiệu ứng viền thủ công tốt hơn là chỉ dùng outline.
                */}

                {/* Lớp Viền phát sáng - ở phía sau (z = -0.01) */}
                <Text
                    fontSize={0.7} // Kích thước bằng chữ chính
                    color="#9400D3" // Màu viền: Tím đậm (Dark Violet)
                    anchorX="center"
                    anchorY="middle"
                    position-z={-0.01} // Đẩy ra sau một chút
                >
                    {name}
                    {/* Viền chỉ cần một vật liệu cơ bản phát sáng nhẹ */}
                    <meshBasicMaterial
                        color="#9400D3"
                        toneMapped={false}
                    />
                </Text>

                {/* Lớp Chữ Chính - ở phía trước */}
                <Text
                    fontSize={0.7}
                    color="#00FFFF" // Màu chữ chính: Xanh lơ (Cyan)
                    anchorX="center"
                    anchorY="middle"
                >
                    {name}
                    <meshStandardMaterial
                        color="#00FFFF"
                        emissive="#00FFFF" // Tự phát sáng cùng màu
                        emissiveIntensity={2.5} // Tăng cường độ sáng
                        toneMapped={false} // Bỏ qua tone-mapping để màu rực rỡ hơn
                    />
                </Text>

            </Billboard>
        </Float>
    );
}