import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard, Float } from '@react-three/drei';
import * as THREE from 'three';

// Tạo một vector tạm để không phải tạo mới trong mỗi frame (tối ưu hiệu suất)
const tempVector = new THREE.Vector3();

export function MemberName({ position, name }) {
    const groupRef = useRef();

    useFrame((state) => {
        // Lấy vị trí của đối tượng trong thế giới 3D
        const worldPosition = groupRef.current.getWorldPosition(tempVector);

        // Tính khoảng cách từ camera đến đối tượng
        const distance = state.camera.position.distanceTo(worldPosition);

        // Đặt một hệ số để điều chỉnh kích thước cuối cùng trên màn hình
        const screenSpaceFactor = 0.05;

        // Tính toán tỷ lệ mới: xa hơn thì scale lớn hơn
        const scale = distance * screenSpaceFactor;

        // Áp dụng tỷ lệ cho group, làm cho kích thước của nó không đổi trên màn hình
        groupRef.current.scale.set(scale, scale, scale);
    });

    return (
        <Float speed={2} floatIntensity={0.1}>
            <Billboard ref={groupRef} position={position}>
                <Text
                    fontSize={0.7}
                    color="#7fffd4" // Màu xanh ngọc (Aquamarine)
                    outlineColor="black"
                    outlineWidth={0.02}
                >
                    {name}
                </Text>
            </Billboard>
        </Float>
    );
}