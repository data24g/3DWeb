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
      <Canvas camera={{ position: [0, 2, 6], fov: 45 }}>

        {/* Logic hiển thị trang 3D */}
        {page === 1 && <Experience />}
        {page === 2 && <PageTwo />}

        {/* Hiệu ứng phát sáng */}
        <EffectComposer>
          <Bloom
            mipmapBlur
            intensity={1.2}
            luminanceThreshold={1}
          />
        </EffectComposer>
      </Canvas>

      {/* Giao diện nút bấm HTML */}
      <div className="ui-container">
        {page === 1 && (
          <button className="custom-button" onClick={() => setPage(2)}>
            <span>Go to Page 2</span>
          </button>
        )}
        {page === 2 && (
          <button className="custom-button" onClick={() => setPage(1)}>
            <span>Back to Page 1</span>
          </button>
        )}
      </div>
    </>
  );
}

export default App;