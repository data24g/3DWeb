// src/App.jsx

import React, { useState, Suspense, useEffect, useLayoutEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Joystick } from 'react-joystick-component';
import * as THREE from 'three';

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

// =============================================================
// === COMPONENT QUẢN LÝ CAMERA ĐÃ ĐƯỢC CẬP NHẬT RESPONSIVE ===
// =============================================================
function CameraManager({ page, isMobileView }) {
  const { camera } = useThree();

  useEffect(() => {
    if (page === 1 || page === 3) {
      // Tính toán vị trí Z của camera dựa trên màn hình
      const cameraZ = isMobileView ? 14 : 8; // Lùi camera ra xa (z=14) trên mobile

      camera.position.set(0, 2, cameraZ);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
      camera.updateProjectionMatrix();
    }
  }, [page, camera, isMobileView]);

  return null;
}

// =============================================================
// === UI Component (Không đổi) ===
// =============================================================
function UI({ page, activePlanet, isMobileView, onAccessPlanet }) {
  return (
    <>
      {page === 2 && (
        <>
          {!isMobileView && (
            <div className="instructions-panel">
              <strong>Điều Khiển:</strong><br />
              W / S - Bay Tới / Lui<br />
              A / D - Bay Ngang Trái / Phải<br />
              E / Q - Bay Lên / Xuống<br />
              Chuột - Nhìn Xung Quanh<br />
              Nhấn Enter để khám phá hành tinh
            </div>
          )}

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


// =============================================================
// === App Component Chính ===
// =============================================================
function App() {
  const [page, setPage] = useState(1);
  const [activePlanet, setActivePlanet] = useState(null);

  const { width } = useWindowSize();
  const isMobileView = width <= 768;

  // Xác định vị trí Z ban đầu của camera một cách linh động
  const initialCameraZ = isMobileView ? 14 : 8;

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
      if (activePlanet.name === 'Earth') {
        setPage(3);
      } else {
        alert(`Hành Tinh Này Chưa Phát Hiện Sự Sống! Hãy thử tới thăm Trái Đất`);
      }
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
        camera={{ position: [0, 2, initialCameraZ], fov: 45 }}
        dpr={[1, 1.5]}
      >
        {/* Truyền isMobileView vào CameraManager */}
        <CameraManager page={page} isMobileView={isMobileView} />

        <Suspense fallback={null}>
          {page === 1 && <Experience setPage={setPage} isMobileView={isMobileView} />}
          {page === 2 && <PageTwo setActivePlanet={setActivePlanet} setPage={setPage} joystickRef={joystickRef} />}
          {page === 3 && <TeamPage setPage={setPage} isMobileView={isMobileView} />}
        </Suspense>

        <EffectComposer>
          <Bloom mipmapBlur intensity={1.2} luminanceThreshold={1} />
        </EffectComposer>
      </Canvas>

      {/* Joystick cho mobile ở Page 2 */}
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

      {/* Giao diện người dùng */}
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