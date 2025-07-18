import { Canvas } from '@react-three/fiber';
import Experience from './Experience';
import { useState } from 'react';
import { PageTwo } from './PageTwo';
import { TeamPage } from './TeamPage'; // Import trang mới
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import './Button.css';

function App() {
  const [page, setPage] = useState(2); // đoạn code để chọn trang khởi tạo khi mở web 

  return (
    <>
      <Canvas camera={{ position: [0, 2, 8], fov: 45 }}>

        {/* Logic hiển thị trang 3D */}
        {page === 1 && <Experience setPage={setPage} />}
        {page === 2 && <PageTwo setPage={setPage} />}
        {page === 3 && <TeamPage setPage={setPage} />} {/* Thêm logic cho trang 3 */}

        {/* Hiệu ứng phát sáng */}
        <EffectComposer>
          <Bloom
            mipmapBlur
            intensity={1.2}
            luminanceThreshold={1}
          />
        </EffectComposer>
      </Canvas>
    </>
  );
}

export default App;