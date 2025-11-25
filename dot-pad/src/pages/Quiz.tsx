import React, {useState, useEffect, useRef, useCallback} from 'react';
import { DotPadSDK } from "../DotPadSDK-1.0.0";
import { Device } from "../device";
import { Animal, animalList, AnimalData, brailleMap } from "../util/animalData";
import DotPadDisplay  from '../components/DotPadDisplay'; 
import DotPadButtons  from '../components/DotPadButtons'; 
import '../App.css';


//퀴즈 상태 정의
interface QuizState {
    currentAnimal : Animal | null; // 정답 동물
    options: string[] //선택지 (예 : ["사자", "호랑이", "곰"])
    correctAnswer: string; //정답 동물 이름
    isAnswered: boolean; //사용자가 답을 선택했는지 여부
    isCorrect: boolean; //사용자의 답이 정답인지
    feedbackMessage: string; 
}


// ---------------------------- 텍스트 -> 헥스 코드 변환 함수 ------------------------------
// 필요한 모든 헥스 코드 animalData.ts에 구현해 사용할 예정
const textToBrailleHex = (parts: string[]): string => {
    //입력된 문자열을 공백 기준으로 나눔
    const hexParts = parts.map(part => {
        return brailleMap[part] || "000000";
    });
    return hexParts.join('');
};
// 받침 유무에 따른 조사 구분
const appendJosa = (word: string, type: '은/는') => {
    if (!word) return "";

    const lastChar = word.charCodeAt(word.length -1);
    const hasBatchim = (lastChar - 0xAC00) % 28 > 0;

    switch (type) { case '은/는' : return hasBatchim ? `${word}은` : `${word}는`;}
};
// ------------------------------------------------------------------------------------


export default function Quiz() {

    //상태 및 Ref 정의
    const dotpadsdk = useRef<DotPadSDK | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [viewMode, setViewMode] = useState<"f1" | "f2" | "f3"> ("f1"); 
    const [historyState, setHistoryState] = useState<QuizState | null>(null);
    const [futureState, setFutureState] = useState<QuizState | null>(null);

    //테스트용 헥스 코드 
    const [testHex, setTestHex] = useState<string | null>(null);

    //퀴즈 로직을 위한 state
    const [quizState, setQuizState] = useState<QuizState>({
        currentAnimal : null,
        options: [],
        correctAnswer: "",
        isAnswered: false, 
        isCorrect: false,
        feedbackMessage: "Dot Pad 연결"
    });

    const quizStateRef = useRef(quizState);
    useEffect(() => {
        quizStateRef.current = quizState;
    }, [quizState]);

    useEffect(() => {
        historyStateRef.current = historyState;
    }, [historyState]);

    const historyStateRef = useRef<QuizState | null>(null);
    const futureStateRef = useRef(futureState);
    useEffect(() => {
        futureStateRef.current = futureState;
    }, [futureState]);

    // 배속 상태 관리 (기본값 1.0)
    const [playbackRate, setPlaybackRate] = useState<number>(1.0);
    const playbackRateRef = useRef(playbackRate);
    const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastKeyTimeRef = useRef<number>(0);


    // 데이터 처리
    // 3개의 랜덤한 답안 옵션 생성
    function generateOptions(correctAnswer:string) {
        let options = [correctAnswer];
        let animalNames = animalList.map(animal => animal.name); //모든 동물 이름 배열

        // 정답과 다른 2개의 오답을 랜덤으로 뽑기
        while (options.length < 3) {
            const randomIndex = Math.floor(Math.random() * animalNames.length);
            const randomAnimalName = animalNames[randomIndex];

            if (!options.includes(randomAnimalName)) {
                options.push(randomAnimalName);
            }
        }

        // 배열을 무작위로 섞기
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        return options;    
    };

    // --- 2. 퀴즈 핵심 로직 함수 ---

    // 새 문제 불러오기
    const loadNewQuestion = useCallback((isInitial: boolean = false) => {
        console.log("새 문제 로드 중...");
        const validAnimals = animalList.filter(a => a.name && a.f1); // 이름과 f1 데이터가 있는 동물만
        if (validAnimals.length === 0) return;

        const randomIndex = Math.floor(Math.random() * animalList.length);
        const correctAnimal = animalList[randomIndex];
        const generatedOptions = generateOptions(correctAnimal.name); 

        const validPoses: ("f1" | "f2" | "f3")[] = [];
        if (correctAnimal.f1 && correctAnimal.f1.length > 10) validPoses.push("f1");
        if (correctAnimal.f2 && correctAnimal.f2.length > 10) validPoses.push("f2");
        if (correctAnimal.f3 && correctAnimal.f3.length > 10) validPoses.push("f3");

        const randomPose = validPoses[Math.floor(Math.random()*validPoses.length)];
        setViewMode(randomPose);

        const optionsText = generatedOptions.map((opt, i) => `${i + 1}번 ${opt}`).join(', ');
        const navText = isInitial ? "" : "이전 문제를 보려면 왼쪽 화살표를 누르세요.";

        setQuizState({
            currentAnimal: correctAnimal,
            options: generatedOptions,
            correctAnswer: correctAnimal.name,
            isAnswered: false,
            isCorrect: false,
            feedbackMessage: `무슨 동물일까요? ${optionsText}. ${navText}`
        });
    }, []);

    // 다음 문제로 이동 또는 원래 문제로 복귀
    const moveToNextQuestion = () => {
        const future = futureStateRef.current;
        const currentQuiz = quizStateRef.current;
        if (future) {
            console.log("원래 문제로 돌아옵니다")
            setQuizState(future);
            setFutureState(null);
            setViewMode("f1");
            return;
        }

        if (currentQuiz.isAnswered && currentQuiz.isCorrect) {
            setHistoryState(currentQuiz);
        }
        loadNewQuestion(false);
    }

    // 이전 문제로 이동
    const moveToPreviousQuestion = () => {
        const previousState = historyStateRef.current;
        const currentQuiz = quizStateRef.current; 
        if (previousState) {
            console.log("이전 문제로 돌아갑니다");
            setFutureState(currentQuiz);
            setQuizState(previousState);
            setViewMode("f1");
        }
    }


    // 정답 확인 로직
    const handleAnswer = async (selectedAnswer: string) => {
        const currentQuiz = quizStateRef.current;

        if (currentQuiz.isAnswered) return; // 이미 답을 선택했으면 무시

        const isCorrect = (selectedAnswer === currentQuiz.correctAnswer);
        let feedbackText = "";

        if (isCorrect) {
            const animal = currentQuiz.currentAnimal;
            const poseText = [
                `1번 ${(animal?.f1 && animal.f1.length > 10) ? animal.pose1 : '없음'}`,
                `2번 ${(animal?.f2 && animal.f2.length > 10) ? animal.pose2 : '없음'}`,
                `3번 ${(animal?.f3 && animal.f3.length > 10) ? animal.pose3 : '없음'}`
            ].join(', ');
    
        // 정답 상태로 변경
        setQuizState(prevState => ({
            ...prevState,
            isAnswered: true, // 정답을 맞췄으므로 상태 변경
            isCorrect: true,
            feedbackMessage: `정답입니다! ${currentQuiz.correctAnswer}입니다. F1에서 F3을 눌러 다른 모습을 확인하세요.  ${poseText}. 다음 문제로 가려면 오른쪽 화살표를 누르세요.`, 
        }));
    
        } else {
            // 오답일 경우
            const optionsText = currentQuiz.options.map((opt, i) => `${i+1}번 ${opt}`).join(', ');
            const navText = historyStateRef.current ? "이전 문제를 보려면 왼쪽 화살표를 누르세요." : "";

            // isAnswered를 true로 바꾸지 않음 (다시 시도해야 하므로)
            setQuizState(prevState => ({
                ...prevState,
                isCorrect: false, // 오답 플래그 (필요하다면)
                feedbackMessage: `땡! ${appendJosa(selectedAnswer, '은/는')} 오답입니다. 다시 시도하세요. ${optionsText}. ${navText}`, // 화면 UI에만 "오답" 표시
            }));
        }
    };


    // --- 3. 닷패드 관련 함수 (Test.tsx) ---

    // 닷패드 키패드 입력 처리
    const dotpadKeyCallback = useCallback(async (keyCode: string) => {
        console.log("=> 닷패드 키 입력: " + keyCode);

        const now = Date.now();
        if (now - lastKeyTimeRef.current < 100) {
            return;
        }
        lastKeyTimeRef.current = now;

        const currentQuiz = quizStateRef.current;      
        const currentAnimal= currentQuiz.currentAnimal;
        const history = historyStateRef.current;

        if (!currentAnimal || !connectedDevice || !dotpadsdk.current) return; // 퀴즈 시작 전이거나 기기 연결 안되면 무시
        
        // F4 처리 로직
        if (keyCode === 'F4') {
            if (clickTimerRef.current) {
                clearTimeout(clickTimerRef.current);
                clickTimerRef.current=null;

                const currentRate = playbackRateRef.current;
                let nextRate = 1.0;

                if (currentRate === 1.0) nextRate = 2.0;
                else if (currentRate === 2.0) nextRate = 4.0;
                else nextRate = 1.0;
            
                setPlaybackRate(nextRate);
                playbackRateRef.current = nextRate;

                handleSpeakFeedback();
                console.log(`배속 변경됨: ${nextRate}`);
            } else { //한 번 누름 -> 현재 메시지 다시 듣기
                clickTimerRef.current = setTimeout(() => {
                    handleSpeakFeedback();
                    clickTimerRef.current = null;
                }, 500);
            }
            return;
        }
        if (currentQuiz.isAnswered) { //상태 2: 정답을 맞춘 후
            switch (keyCode) {
                case 'F1' : 
                    if (currentAnimal?.f1) setViewMode('f1'); 
                    else console.log("F1 데이터 없음"); 
                    break;
                case 'F2' : 
                    if (currentAnimal?.f1) setViewMode('f2'); 
                    else console.log("F2 데이터 없음"); 
                    break;
                case 'F3' : 
                    if (currentAnimal?.f1) setViewMode('f3'); 
                    else console.log("F3 데이터 없음"); 
                    break;
                case 'Right' : case 'next': moveToNextQuestion(); break;
                case 'F4' : console.log("종료"); break;
            }

        } else if (!quizState.isAnswered) { //상태 1: 정답 맞추기 전
            switch (keyCode) {
                case 'F1' : if (currentQuiz.options[0]) handleAnswer(currentQuiz.options[0]); break;
                case 'F2' : if (currentQuiz.options[1]) handleAnswer(currentQuiz.options[1]); break;
                case 'F3' : if (currentQuiz.options[2]) handleAnswer(currentQuiz.options[2]); break;
                case 'Left' :
                    if (history) moveToPreviousQuestion();
                    else console.log('이전 히스토리 없음');
                    break;
            }
        }
    }, [loadNewQuestion, moveToNextQuestion]);
       
    useEffect(() => {
        if (connectedDevice) {
            console.log("기기가 연결되었습니다. 첫 문제를 로드합니다.");
            loadNewQuestion(true);
        }
    }, [connectedDevice, loadNewQuestion]); // connectedDevice나 loadNewQuestion이 변경될 때 실행

    // SDK 초기화 (페이지 로드 시 1회)
    useEffect(() => {
        dotpadsdk.current = new DotPadSDK();
      }, []);
    
      const updateDeviceConnection = async (device: any, connected: any) => {
        if (connected) {
          const isConnected = await dotpadsdk.current?.connect(device.target);
          if (isConnected) {
            await dotpadsdk.current?.addListenerKeyEvent(
              device.target,
              dotpadKeyCallback
            );
            setConnectedDevice(device);
          }
        } else {
          await dotpadsdk.current?.disconnect(device.target);
          setConnectedDevice(null);
        }
        setDevices((devices) =>
          devices.map((d) => (d.name === device.name ? { ...d, connected } : d))
        );
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

    // 닷패드 없이 웹 UI 테스트를 위한 함수
    const handleStartTestMode = () => {
        console.log("Starting Test Mode...");
        const mockDevice = {
            target: "mock-device" as any,
            name: "Test Device",
            connected: true,
        } as Device;
        setConnectedDevice(mockDevice);
        
        setDevices([mockDevice]);
    };

    const animal = quizState.currentAnimal;

    const textHex = textToBrailleHex(
        !quizState.isAnswered
        ? quizState.options
        : [
            (animal?.f1 && animal.f1.length > 10) ? animal.pose1 : "없음",
            (animal?.f2 && animal.f1.length > 10) ? animal.pose2 : "없음",
            (animal?.f3 && animal.f1.length > 10) ? animal.pose3 : "없음",
        ]
    )

    const graphicHex = quizState.currentAnimal
        ? quizState.currentAnimal[viewMode]
        : ""

    useEffect(() => {
        if (!connectedDevice || !dotpadsdk.current) return;

        const updateDotPad = async () => {
            // 1. 그래픽(이미지) 전송
            if (graphicHex) {
                await dotpadsdk.current?.displayGraphicData(connectedDevice.target, graphicHex);
            }
            // 2. 텍스트(점자) 전송
            if (textHex) {
                await dotpadsdk.current?.displayTextData(connectedDevice.target, textHex);
            }
        };
        updateDotPad();
    }, [connectedDevice, graphicHex, textHex]);





    // --- TTS (음성 합성) 로직 시작 ---
    const handleSpeakFeedback = useCallback(() => {
        // 기존에 나오고 있던 음성이 있다면 취소
        window.speechSynthesis.cancel();

        const textToSpeak = quizStateRef.current.feedbackMessage;
                
        // 브라우저 지원 확인
        if (!window.speechSynthesis) {
            alert("이 브라우저는 음성 합성을 지원하지 않습니다.");
            return;
        }

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = "ko-KR"; // 한국어 설정
        utterance.rate = playbackRateRef.current; // [수정] 현재 설정된 배속 적용
        utterance.pitch = 1.0;    // 톤 설정

        window.speechSynthesis.speak(utterance);
    }, []);

    // 동물이 바뀌거나(animalIdx 변경) 컴포넌트가 언마운트될 때 음성 중지
        useEffect(() => {
            if (connectedDevice && quizState.feedbackMessage) {
                const timer = setTimeout(() => {
                    handleSpeakFeedback();
                }, 100);
            return () => clearTimeout(timer);
            }
        }, [quizState.feedbackMessage, connectedDevice, handleSpeakFeedback]);
    // --- TTS 로직 끝 ---   
    




    // --- 5. UI 렌더링 ---
    return (
        <>
            <div className="App">
                <h2>Dot Pad Display Test</h2>
                    <div className="buttonContainer">
                        <button className="selectButton" onClick={handleSelectDevice}>
                            Select DotPad
                        </button>
                    </div>
                    <table className="table">
                <thead>
                    <tr>
                        <th className="header">DotPad Name</th>
                        <th className="header">Connect/Disconnect</th>
                    </tr>
                </thead>
                <tbody>
                    {devices.map((device) => (
                        <tr key={device.name} className="row">
                            <td className="cell">{device.name}</td>
                            <td className="cell">
                                {!device.connected && (
                                    <button
                                        className="button"
                                        onClick={() => updateDeviceConnection(device, true)}
                                    >   
                                        Connect
                                    </button>
                                )}
                                {device.connected && (
                                    <button
                                        className="button"
                                        onClick={() => updateDeviceConnection(device, false)}
                                    >
                                        Disconnect
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
            <div className="quiz-container">
                <h2>동물 퀴즈</h2>
                
                {/* ... (기기 연결 UI는 동일) ... */}

                <hr /> 

                {/* 테스트 모드 시작 버튼 */}
                {!connectedDevice && (
                    <div style={{ padding: '20px' }}>
                        <p>실물 닷패드 기기가 없으신가요?</p>
                        <button className="button" onClick={handleStartTestMode}>
                            웹 UI 테스트 모드 시작
                        </button>
                    </div>
                )}

                {/* 퀴즈 디스플레이 영역 */}
                {connectedDevice && quizState.currentAnimal ? (
                    <div className="quiz-area">
                    <DotPadDisplay
                        mainData={graphicHex}
                        subData={testHex ?? textHex} // 테스트용 헥스 추가
                />
                    
                    {/* 사용자 컨트롤 영역 (웹 UI 버튼) */}
                    <div className="controls-area">
                    <p>{quizState.feedbackMessage}</p> {/* 화면에 텍스트 피드백 */}
                    
                    {!quizState.isAnswered ? (
                        // 상태 1: 답 선택 전
                        <div className="options-container">
                        </div>
                    ) : (
                        // 상태 2: 답 선택 후
                        <div className="next-question-container">
                        {quizState.isCorrect ? (
                            // 정답 맞췄을 때
                            <>
                            
                            </>
                        ) : (
                            <button className="button" onClick={() => loadNewQuestion(false)}>
                            다음 문제 (→)
                            </button>
                        )}
                        </div>
                    )}
                    {/*</div>button className="button" onClick={() => dotpadKeyCallback('F4')}>종료 (F4)</button>*/}
                    </div>
                </div>
                ) : (
                <p>Dot Pad를 연결해주세요. 퀴즈가 시작됩니다.</p>
                )}

                {/* DotPad 물리적 버튼 매핑 (UI 없이 기능만) */}
                {connectedDevice && (
                <DotPadButtons 
                    onArrowButtonClick={(key) => dotpadKeyCallback(key === 'next' ? 'Right' : 'Left')}
                    onFunctionButtonClick={(key) => dotpadKeyCallback(key.toUpperCase())} 
                />
                )}

                {/* --- 음성 설명 버튼 및 텍스트 영역 --- */}
                <div style={{ margin: "15px 0", padding: "10px", border: "1px solid #ccc", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
                    
                    {/* 음성 듣기 메인 버튼 */}
                    <button 
                        onClick={handleSpeakFeedback}
                        style={{
                            padding: "10px 20px",
                            fontSize: "1rem",
                            cursor: "pointer",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            marginBottom: "10px",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            margin: "0 auto 10px auto" // 아래쪽 여백 추가
                        }}
                    >
                        TTS 출력 버튼
                    </button>

                {/* [추가] 배속 조절 버튼 영역 */}
                <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "10px" }}>
                    {[1.0, 2.0, 4.0].map((rate) => (
                        <button
                            key={rate}
                            onClick={() => setPlaybackRate(rate)}
                            style={{
                                padding: "5px 10px",
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                // 선택된 배속이면 파란색, 아니면 회색
                                backgroundColor: playbackRate === rate ? "#0056b3" : "#e0e0e0",
                                color: playbackRate === rate ? "white" : "#333",
                                border: "none",
                                borderRadius: "4px",
                                transition: "background-color 0.2s"
                            }}
                        >
                            {rate}배속
                        </button>
                    ))}
                </div>
                </div>        
                
                {/* ================= 웹 UI 매핑 테스트 패널 ================= */}
                <div style={{ marginTop: '30px', padding: '15px', border: '2px dashed blue', background: '#f0f9ff' }}>
                    <h3>매핑 테스트</h3>
                    
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
                        
                        {/* 3. 리셋 버튼 */}
                        <button onClick={() => setTestHex(null)} style={{background: '#ffcccc'}}>테스트 종료 (원래대로)</button>
                    </div>

                    <div>
                        <input 
                            type="text" 
                            placeholder="직접 입력 (예: A5)" 
                            onChange={(e) => setTestHex(e.target.value)}
                            style={{ padding: '5px', width: '150px', marginRight: '10px' }}
                        />
                        <span>입력하는 대로 바로 위에 뜸</span>
                    </div>
                </div>
                {/* ========================================================== */}

            </div>
        </>
    );
        
    
}