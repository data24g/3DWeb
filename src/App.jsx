// src/App.jsx

import React, { useState, Suspense, useEffect, useLayoutEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Joystick } from 'react-joystick-component';
import * as THREE from 'three';

import Experience from './Experience';
import { PageTwo } from './PageTwo';
import { TeamPage } from './TeamPage';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Notification } from './Notification'; // Import component mới
import './responsive.css';

// Lớp phủ thông báo khi mất ngữ cảnh WebGL
function WebGLRecoveryScreen() {
  return (
    <div className="webgl-recovery-screen">
      <div className="recovery-message">
        <h1>Mất Kết Nối Đồ Họa</h1>
        <p>Hệ thống đang cố gắng phục hồi môi trường 3D. Vui lòng chờ trong giây lát...</p>
      </div>
    </div>
  );
}


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
  const [notification, setNotification] = useState(null);
  const [questionPlanet, setQuestionPlanet] = useState(null); // State mới để "khóa" hành tinh đang hỏi
  const [isLost, setIsLost] = useState(false); // State mới để theo dõi trạng thái mất ngữ cảnh

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
        window.location.href = '/pages/HomePage.html';
      } else if (activePlanet.question) {
        setQuestionPlanet(activePlanet); // Lưu lại hành tinh đang hỏi
        setNotification({
          type: 'question',
          message: activePlanet.question.text,
        });
      }
    }
  };

  const handleAnswer = (userAnswer) => {
    if (!questionPlanet) return; // Nếu không có hành tinh nào được hỏi, thoát

    const isCorrect = userAnswer === questionPlanet.question.answer;
    if (isCorrect) {
      setNotification({
        type: 'success',
        message: 'Chính xác! Tín hiệu của sự sống được cho là phát ra từ một hành tinh xanh dương gần đó. Hãy thử tìm đến Trái Đất!',
      });
    } else {
      setNotification({
        type: 'error',
        message: 'Không chính xác. Dữ liệu từ hành tinh này không cho thấy gì thú vị. Hãy tiếp tục khám phá.',
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification(null);
    setQuestionPlanet(null); // Xóa hành tinh đã lưu khi đóng thông báo
  };

  // Hệ thống phục hồi WebGL
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const onContextLost = (event) => {
      event.preventDefault();
      console.warn('Cảnh báo: Ngữ cảnh WebGL đã bị mất!');
      setIsLost(true);
    };

    const onContextRestored = () => {
      console.log('Thông tin: Ngữ cảnh WebGL đã được phục hồi.');
      setIsLost(false);
    };

    canvas.addEventListener('webglcontextlost', onContextLost, false);
    canvas.addEventListener('webglcontextrestored', onContextRestored, false);

    return () => {
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
    };
  }, []);


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
      {isLost ? (
        <WebGLRecoveryScreen />
      ) : (
        <Canvas
          // Thêm key để buộc React tái tạo toàn bộ Canvas khi ngữ cảnh được khôi phục
          key={isLost ? 'lost' : 'restored'}
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
      )}

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

      {/* Hiển thị component thông báo đã được nâng cấp */}
      <Notification
        notification={notification}
        onAnswer={handleAnswer}
        onClose={handleCloseNotification}
      />
    </>
  );
}

export default App;