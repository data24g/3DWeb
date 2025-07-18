import { Canvas } from '@react-three/fiber';
import Experience from './Experience';
import { useState } from 'react';
import { PageTwo } from './PageTwo';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import './Button.css'; // Import file CSS mới

function App() {
  const [page, setPage] = useState(1);

  return (
    <>
      <Canvas camera={{ position: [0, 2, 8], fov: 45 }}>

        {/* Logic hiển thị trang 3D */}
        {page === 1 && <Experience setPage={setPage} />}
        {page === 2 && <PageTwo setPage={setPage} />}

        {/* Hiệu ứng phát sáng */}
        <EffectComposer>
          <Bloom
            mipmapBlur
            intensity={1.2}
            luminanceThreshold={1}
          />
        </EffectComposer>
      </Canvas>

      {/* Giao diện nút bấm HTML đã được loại bỏ */}
    </>
  );
}

export default App;