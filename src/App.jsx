import React, { useState, Suspense, useEffect, useLayoutEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Joystick } from 'react-joystick-component';
import Experience from './Experience';
import { PageTwo } from './PageTwo';
import { TeamPage } from './TeamPage';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import './responsive.css';

// =============================================================
// === HOOK TÙY CHỈNH ĐỂ LẤY KÍCH THƯỚC CỬA SỔ TRÌNH DUYỆT ===
// =============================================================
function useWindowSize() {
  const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
  useLayoutEffect(() => {
    function handleResize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return { width: size[0], height: size[1] };
}


// Component UI được cập nhật
function UI({ page, activePlanet, isMobileView, onAccessPlanet }) {
  return (
    <>
      {page === 2 && (
        <>
          {/* 1. Chỉ hiển thị hướng dẫn trên giao diện Desktop (!isMobileView) */}
          {!isMobileView && (
            <div className="instructions-panel">
              <strong>Điều Khiển:</strong><br />
              W / S - Bay Tới / Lui<br />
              A / D - Bay Ngang Trái / Phải<br />
              E / Q - Bay Lên / Xuống<br />
              Chuột - Nhìn Xung Quanh
            </div>
          )}

          {/* 2. Nút khám phá vẫn hoạt động như cũ */}
          {activePlanet && (
            <button className="access-button" onClick={onAccessPlanet}>
              Khám phá {activePlanet.name}
            </button>
          )}
        </>
      )}
    </>
  );
}


function App() {
  const [page, setPage] = useState(1);
  const [activePlanet, setActivePlanet] = useState(null);

  // 3. Sử dụng hook mới để lấy chiều rộng màn hình
  const { width } = useWindowSize();

  // 4. Xác định giao diện "mobile" dựa trên chiều rộng, 768px là một ngưỡng phổ biến
  const isMobileView = width <= 768;

  const joystickRef = useRef({ x: 0, y: 0, direction: null, distance: 0 });

  const handleJoystickMove = (stick) => {
    joystickRef.current = {
      x: stick.x || 0,
      y: stick.y || 0,
      direction: stick.direction,
      distance: stick.distance || 0,
    };
  };

  const handleJoystickStop = () => {
    joystickRef.current = { x: 0, y: 0, direction: null, distance: 0 };
  };

  const accessPlanet = () => {
    if (activePlanet) {
      alert(`Đã truy cập vào ${activePlanet.name}!`);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (page === 2 && e.key.toLowerCase() === 'enter' && activePlanet) {
        accessPlanet();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePlanet, page]);

  return (
    <>
      <Canvas
        camera={{ position: [0, 2, 8], fov: 45 }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          {/* Thêm isMobileView vào prop của Experience */}
          {page === 1 && <Experience setPage={setPage} isMobileView={isMobileView} />}

          {page === 2 && <PageTwo setActivePlanet={setActivePlanet} setPage={setPage} joystickRef={joystickRef} />}

          {/* Thêm isMobileView vào prop của TeamPage */}
          {page === 3 && <TeamPage setPage={setPage} isMobileView={isMobileView} />}
        </Suspense>

        <EffectComposer>
          <Bloom mipmapBlur intensity={1.2} luminanceThreshold={1} />
        </EffectComposer>
      </Canvas>

      {/* 5. Chỉ hiển thị Joystick nếu là GIAO DIỆN mobile VÀ đang ở trang 2 */}
      {isMobileView && page === 2 && (
        <div style={{
          position: 'absolute',
          bottom: '50px',
          left: '50px',
          zIndex: 110,
        }}>
          <Joystick
            size={100}
            baseColor="rgba(255, 255, 255, 0.2)"
            stickColor="rgba(255, 255, 255, 0.5)"
            move={handleJoystickMove}
            stop={handleJoystickStop}
          />
        </div>
      )}

      {/* 6. Truyền isMobileView thay cho isTouchDevice */}
      <UI
        page={page}
        activePlanet={activePlanet}
        isMobileView={isMobileView}
        onAccessPlanet={accessPlanet}
      />
    </>
  );
}

export default App;