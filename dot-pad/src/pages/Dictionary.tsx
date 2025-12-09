import React from "react";
import { useEffect, useRef, useState } from "react";
import { DotPadSDK } from "../DotPadSDK-1.0.0";
import { Device } from "../device";
import { animalList, AnimalData } from "../util/animalData"; // 테스트 데이터를 저장해놓은 곳
import Quiz from "../components/Quiz";
import DotPadConnectBar from "../components/DotPadConnectBar";
import AnimalBlock from "../components/AnimalBlock";
import "../App.css";

import DotPadDisplay from "../components/DotPadDisplay";
import DotPadButtons from "../components/DotPadButtons";


export default function Dictionary() {
  
  const dotpadsdk = useRef<DotPadSDK>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [quizMode, setQuizMode] = useState<Boolean>(false);

  const [animalIdx, setAnimalIdx] = React.useState<number>(0); // 현재 출력 중인 동물 종의 인덱스 ex) 0:개, 1:고양이, 2:펭귄
  const [buttonName, setButtonName] = React.useState<"f1" | "f2" | "f3" | "f4">("f1"); // 누른 버튼의 종류 ex) f1 ~ f4

  // 그림판에 표시할 데이터 상태 정의
  const mainDisplayData = AnimalData({animalIdx, buttonName}); // AnimalData: 입력한 인덱스에 알맞는 정보를 반환

  //페이지가 켜질 때 딱 한 번 실행
  useEffect(() => { 
    console.log("Dictionary 페이지 로드됨, SDK 초기화 시작") //디버깅용 로그

    dotpadsdk.current = new DotPadSDK();    // SDK  인스턴스 생성
    console.log("SDK 인스턴스 생성 완료:", dotpadsdk.current);

  }, []);


  // 버튼을 누를 때마다 동물 이미지를 새로 출력 (퀴즈 모드가 아닐 때만)
  useEffect(() => {
    if (quizMode) return; // 퀴즈 모드일 때는 Dictionary 이미지 출력 안 함
    if (!devices[0] || !devices[0].connected) return;
    const data = AnimalData({animalIdx, buttonName});
    if (data) {
      handlePrintImage(data);
    }
  }, [mainDisplayData, devices, quizMode])


  // Quiz에서 사용할 키 핸들러를 Dictionary에서 관리
  const [quizKeyHandler, setQuizKeyHandler] = React.useState<((keycode: string) => void) | null>(null);

  // key listener 추가 (Dictionary와 Quiz 통합)
  useEffect(() => {
    const targetDevice = devices[0];
    if (!targetDevice || !targetDevice.connected) return;

    const listener = (keycode: string) => {
      console.log('닷 패드 키 입력:', keycode);
      
      // 퀴즈 모드일 때는 Quiz의 핸들러 실행
      if (quizMode && quizKeyHandler) {
        quizKeyHandler(keycode);
        return;
      }
      
      // Dictionary 모드일 때만 아래 로직 실행
      const mappingFunctionKey: Record<string, "f1" | "f2" | "f3" | "f4"> = {
        "1": "f1",  // F1 버튼
        "2": "f2",  // F2 버튼
        "3": "f3",  // F3 버튼
        "4": "f4"   // F4 버튼
      }
      const mappingArrowKey: Record<string, "prev" | "next"> = {
        "0": "prev", // left
        "5": "next"  // right
      }
      
      if (["1", "2", "3", "4"].includes(keycode)) {
        const fn = mappingFunctionKey[keycode];
        if (fn) {
          console.log("누른 버튼의 기능이 작동합니다.", fn);
          onFunctionButtonClick(fn);
        }
      } else if (["0", "5"].includes(keycode)) {
        const dir = mappingArrowKey[keycode];
        if (dir) {
          console.log("누른 버튼의 기능이 작동합니다.", dir);
          onArrowButtonClick(dir);
        }
      } else {
        console.log("해당 버튼을 매핑할 수 없습니다.", keycode);
      }
    };
    console.log('key listener를 닷패드 기기에 추가합니다.', targetDevice.name);
    dotpadsdk.current?.addListenerKeyEvent(targetDevice.target, listener);
  }, [devices, quizMode, quizKeyHandler]);
  
  // 기기가 처음 연결되었을 때 초기 이미지 출력 (Dictionary 모드일 때만)
  useEffect(() => {
    const targetDevice = devices[0];
    if (!targetDevice || !targetDevice.connected) return;
    if (quizMode) return; // 퀴즈 모드에서는 실행하지 않음
    
    // 연결 직후 초기 이미지 출력
    const timer = setTimeout(() => {
      handlePrintImage(mainDisplayData);
    }, 500); // 연결 안정화를 위한 짧은 딜레이
    
    return () => clearTimeout(timer);
  }, [devices.length > 0 ? devices[0]?.connected : false]); // 연결 상태가 변경될 때만 실행
  

  // f1 ~ f4 버튼을 눌렀을 때의 행동을 정의해놓은 함수
  const onFunctionButtonClick = (buttonName: "f1" | "f2" | "f3" | "f4") => {
    setButtonName(buttonName);
  }

  
  // 좌(prev), 우(next) 화살표를 눌렀을 때의 행동을 정의해놓은 함수
  const onArrowButtonClick = (buttonName: "prev" | "next") => {
    if (buttonName === "prev") {
      setAnimalIdx((x) => (x-1+animalList.length)%animalList.length)
    } else {
      setAnimalIdx((x) => (x+1)%animalList.length)
    }
  };


  // 그래픽 출력 테스트 함수
  const handlePrintImage = async (mainDisplayData: string) => {
    console.log("이미지 출력");
    const targetDevice = devices[0];
    
    // 데이터 유효성 검사
    if (!mainDisplayData || typeof mainDisplayData !== 'string') {
      console.warn("부적절한 이미지 데이터입니다.", mainDisplayData);
      return;
    }
    
    //****** 실제 패드 연결시 사용할 부분 *****
    if (dotpadsdk.current && targetDevice && targetDevice.connected) {
      try {
        //Test.tsx의 이미지 출력 함수 사용
        await dotpadsdk.current.displayGraphicData(targetDevice, mainDisplayData); // SDK text 출력 코드
      } catch (error) {
        console.error("SDK error:", error);
        handlePrintError();
      }
    } else {
      handlePrintError();
    }

  };

  const handlePrintError = () => {
    console.error("hanlge pring error");
    //alert("기기를 먼저 연결하세요.")
  }


// --------------test.tsx 에서 필요한 함수 가져옴------------------

  const updateDeviceConnection = async (device: any, connected: any) => {
    if (connected) {
      console.log('Attempting to connect to device:', device.name);
      const isConnected = await dotpadsdk.current?.connect(device.target);
      console.log('Connection result:', isConnected);
      if (isConnected) {
        console.log('Device connected successfully:', device.name);
        // Listener will be added by the useEffect hook
      } else {
        console.error('Failed to connect to device:', device.name);
        return; // Don't update state if connection failed
      }
    } else {
      console.log('Disconnecting from device:', device.name);
      await dotpadsdk.current?.disconnect(device.target);
    }
    setDevices((devices) =>
      devices.map((d) => (d.name === device.name ? { ...d, connected } : d))
    ); // 객체에서 connected만 변경
  };

  // Function to select a DotPad device
  const handleSelectDevice = async () => {
    const device = await dotpadsdk.current?.request(); // 브라우저 창을 띄워서 DotPad 블루투스 장치를 선택하게 한 다음, 선택된 장치 객체를 반환
    const deviceInfo = {
      target: device,
      name: device.name,
      connected: false,
    };
    setDevices((currentDevices) => [...currentDevices, deviceInfo]);
  };
 
  const handleQuizMode = () => {
    setQuizMode((current) => !current)
  }
//----------------------------------------------------------------------

// UI 출력 부분 ---------------------------------------------------------
  return (
      <div className="App">
        <h2>Dot Pad Display Test</h2>
        <DotPadConnectBar
          dotpadsdk={dotpadsdk}
          devices={devices}
          setDevices={setDevices}
        />
        
        <button onClick={handleQuizMode} >퀴즈 모드 전환</button>
        {quizMode ? (
          <Quiz 
            dotpadsdk={dotpadsdk}
            devices={devices}
            setDevices={setDevices}
            mainDisplayData={mainDisplayData}
            setQuizKeyHandler={setQuizKeyHandler}
          />
        ) : (
          <div>
            <DotPadDisplay mainData={mainDisplayData} subData="" />
            <DotPadButtons onArrowButtonClick={onArrowButtonClick} onFunctionButtonClick={onFunctionButtonClick} />
            <AnimalBlock animalIdx={animalIdx} buttonName={buttonName} />
          </div>
        )}
      </div>
    );
}