import { Text, Billboard, PresentationControls, Float } from '@react-three/drei';

// Không cần prop setPage và WorldButton nữa
export default function Experience() {
    return (
        <PresentationControls
            global
            speed={1.5}
            zoom={0.8}
            rotation={[0, 0, 0]}
            polar={[-0.4, Math.PI / 2]}
            azimuth={[-1, Math.PI / 4]}
        >
            <ambientLight intensity={0.5} />
            <directionalLight position={[1, 2, 3]} intensity={1.5} />

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
                            emissiveIntensity={1.5}
                            toneMapped={false}
                        />
                    </Text>
                </Float>
            </Billboard>

            <Billboard>
                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.2}>
                    <Text position={[0, 2.5, 0]} fontSize={0.5} color="white" anchorX="center" anchorY="middle">
                        WELCOME TO MY SITE!
                    </Text>
                </Float>
            </Billboard>

            <mesh rotation-x={-Math.PI * 0.5} position-y={-1.5}>
                <planeGeometry args={[10, 10]} />
                <meshStandardMaterial color="#333333" />
            </mesh>
        </PresentationControls>
    );
}