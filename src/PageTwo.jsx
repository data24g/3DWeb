import { Text, PresentationControls, Float, Torus } from '@react-three/drei';
import { WorldButton } from './WorldButton';

export function PageTwo({ setPage }) {
  return (
    <PresentationControls
        global
        speed={1.5}
        zoom={0.8}
        rotation={[0, 0, 0]}
        polar={[-0.4, Math.PI / 2]}
        azimuth={[-Math.PI / 4, Math.PI / 4]}
    >
        {/* Thiết lập các nguồn sáng */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[1, 2, 3]} intensity={1.5} />
        
        {/* Một khối hình khác để trang 2 trông thú vị hơn */}
        <Float>
            <Torus args={[1, 0.4, 32, 32]} position-y={0.5}>
                <meshStandardMaterial 
                    color="tomato"
                    emissive="tomato"
                    emissiveIntensity={0.5}
                    toneMapped={false}
                />
            </Torus>
        </Float>

        <Text
            position={[0, 2.5, 0]}
            fontSize={0.5}
            color="white"
            anchorX="center"
            anchorY="middle"
        >
            THIS IS PAGE 2
        </Text>

        {/* Nút quay lại trang 1 */}
        <WorldButton
            position={[0, -2, 0]}
            text="Back to Page 1"
            onClick={() => setPage(1)}
        />
    </PresentationControls>
  );
}