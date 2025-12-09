import React, {useState, useEffect, useRef, useCallback} from 'react';
import { DotPadSDK } from "../DotPadSDK-1.0.0";
import { Device } from "../device";
import { Animal, animalList, AnimalData } from "../util/animalData";
import DotPadDisplay  from '../components/DotPadDisplay'; 
import DotPadButtons  from '../components/DotPadButtons'; 
import '../App.css';


// 타입 정의
interface QuizState {
    currentAnimal : Animal | null; // 정답 동물
    options: string[] //선택지 (예 : ["사자", "호랑이", "곰"])
    correctAnswer: string; //정답 동물 이름
    isAnswered: boolean; //사용자가 답을 선택했는지 여부
    isCorrect: boolean; //사용자의 답이 정답인지
    feedbackMessage: string; 
    viewMode?: "f1" | "f2" | "f3";
    questionNumber: number;
}

interface QuizProps {
  dotpadsdk: React.RefObject<DotPadSDK | null>;
  devices: Device[];
  setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
  mainDisplayData: string;
  setQuizKeyHandler: React.Dispatch<React.SetStateAction<((keycode: string) => void) | null>>;
}

const appendJosa = (word: string, type: '은/는') => {
    if (!word) return "";

    const lastChar = word.charCodeAt(word.length -1);
    const hasBatchim = (lastChar - 0xAC00) % 28 > 0;

    switch (type) { case '은/는' : return hasBatchim ? `${word}은` : `${word}는`;}
};

export default function Quiz({ dotpadsdk, devices, setDevices, mainDisplayData, setQuizKeyHandler }: QuizProps) {
    // 모드 관리
    const [mode, setMode] = useState<'menu' | 'integrated' | 'category'>('menu');

    //상태 및 Ref
    const connectedDevice = devices[0];
    //const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [viewMode, setViewMode] = useState<"f1" | "f2" | "f3"> ("f1"); 

    //히스토리 관리
    const [historyState, setHistoryState] = useState<QuizState | null>(null);
    const [futureState, setFutureState] = useState<QuizState | null>(null);

    //퀴즈 state
    const [quizState, setQuizState] = useState<QuizState>({
        currentAnimal : null,
        options: [],
        correctAnswer: "",
        isAnswered: false, 
        isCorrect: false,
        feedbackMessage: "Dot Pad 연결",
        questionNumber: 1,
    });

    // 카테고리 모드 관련
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const categories = Array.from(new Set(animalList.map(a => a.category).filter(Boolean))) as string[];
    
    //Refs
    const quizStateRef = useRef(quizState);
    const historyStateRef = useRef<QuizState | null>(null);
    const futureStateRef = useRef(futureState);
    const questionCounterRef = useRef(1);

    // 배속 및 타이머 관리
    const [playbackRate, setPlaybackRate] = useState<number>(1.0);
    const playbackRateRef = useRef(playbackRate);
    const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastKeyTimeRef = useRef<number>(0);

    //State 동기화
    useEffect(() => { playbackRateRef.current = playbackRate; }, [playbackRate]);
    useEffect(() => { quizStateRef.current = quizState; }, [quizState]);
    useEffect(() => { historyStateRef.current = historyState; }, [historyState]);
    useEffect(() => { futureStateRef.current = futureState; }, [futureState]);

    // SDK는 Dictionary에서 이미 초기화되어 있으므로 Quiz에서는 초기화하지 않음
    
    //----로직 함수----
    // 1. 3개의 랜덤한 답안 옵션 생성
    function generateOptions(correctAnswer:string, candidateList: Animal[]) {
        let options = [correctAnswer];
        let candidateNames = candidateList.map(animal => animal.name);
        while (options.length < 3) {
            const randomIndex = Math.floor(Math.random() * candidateNames.length);
            const randomAnimalName = candidateNames[randomIndex];
            if (!options.includes(randomAnimalName)) {
                options.push(randomAnimalName);
            }
        }
        // 셔플
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        return options;    
    };

    // 2. 새 문제 불러오기
    const loadNewQuestion = useCallback((isInitial: boolean = false) => {
        console.log(`loadNewQuestion 호출됨. isInitial: ${isInitial}`);
        let targetList = animalList;

        if (mode === 'category' && selectedCategory) {
            targetList = animalList.filter(a => a.category === selectedCategory);
        }

        const validAnimals = targetList.filter(a => a.name && a.f1); 

        const correctAnimal = validAnimals[Math.floor(Math.random() * validAnimals.length)];
        const generatedOptions = generateOptions(correctAnimal.name, validAnimals); 

        let nextNumber;
        if (isInitial) {
            questionCounterRef.current = 1;
            nextNumber = 1;
        } else {
            questionCounterRef.current += 1;
            nextNumber = questionCounterRef.current;
            console.log(`이전 번호: ${nextNumber -1}, 이번 번호: ${nextNumber}`)
        }

        //유효한 포즈 중 하나 랜덤 선택
        const validPoses: ("f1" | "f2" | "f3")[] = [];
        if (correctAnimal.f1 && correctAnimal.f1.length > 10) validPoses.push("f1");
        if (correctAnimal.f2 && correctAnimal.f2.length > 10) validPoses.push("f2");
        if (correctAnimal.f3 && correctAnimal.f3.length > 10) validPoses.push("f3");

        const randomPose = validPoses[Math.floor(Math.random()*validPoses.length)]
        setViewMode(randomPose);

        const optionsText = generatedOptions.map((opt, i) => `${numberToHangul(i + 1)}번 ${opt}`).join(', ');
        const navText = isInitial ? "" : "이전 문제를 보려면 왼쪽 화살표를 누르세요.";

        setQuizState({
            currentAnimal: correctAnimal,
            options: generatedOptions,
            correctAnswer: correctAnimal.name,
            isAnswered: false,
            isCorrect: false,
            feedbackMessage: `무슨 동물일까요? ${optionsText}. ${navText}`,
            viewMode: randomPose,
            questionNumber: nextNumber
        });
    }, [mode, selectedCategory]);

    // 3. 다음 문제 / 이전 문제 이동
    const moveToNextQuestion = useCallback(() => {
        if (futureStateRef.current) {
            console.log("원래 문제로 돌아옵니다")
            setQuizState(futureStateRef.current);
            setFutureState(null);
            setViewMode(futureStateRef.current.viewMode || "f1");
            return;
        }
        if (quizStateRef.current.isAnswered && quizStateRef.current.isCorrect) {
            setHistoryState(quizStateRef.current);
        }
        loadNewQuestion(false);
    }, [loadNewQuestion]);

    const moveToPreviousQuestion = useCallback(() => {
        if (historyStateRef.current) {
            console.log("이전 문제로 돌아갑니다");
            setFutureState(quizStateRef.current);
            setQuizState(historyStateRef.current);
            setViewMode("f1");
        }
    }, []);

    // 4. 정답 확인
    const handleAnswer = useCallback(async (selectedAnswer: string) => {
        const currentQuiz = quizStateRef.current;
        if (currentQuiz.isAnswered) return;

        const isCorrect = (selectedAnswer === currentQuiz.correctAnswer);

        if (isCorrect) {
            const animal = currentQuiz.currentAnimal;
            const numAnswer = `. ${animal}`
            const poseText = [
                `일번 ${(animal?.f1 && animal.f1.length > 10) ? animal.pose1 : '없음'}`,
                `이번 ${(animal?.f2 && animal.f2.length > 10) ? animal.pose2 : '없음'}`,
                `삼번 ${(animal?.f3 && animal.f3.length > 10) ? animal.pose3 : '없음'}`
            ].join(', ');
    
        setQuizState(prev => ({
            ...prev,
            isAnswered: true, 
            isCorrect: true,
            feedbackMessage: `정답입니다! ${currentQuiz.correctAnswer}입니다. F1에서 F3을 눌러 다른 모습을 확인하세요.  ${poseText}. 다음 문제로 가려면 오른쪽 화살표를 누르세요.`, 
        }));
    
        } else {
            console.log("현재 historyRef값:", historyStateRef.current);
            const optionsText = currentQuiz.options.map((opt, i) => `${numberToHangul(i + 1)}번 ${opt}`).join(', ');
            const navText = historyStateRef.current ? "이전 문제를 보려면 왼쪽 화살표를 누르세요." : "";
            setQuizState(prev => ({
                ...prev,
                isCorrect: false, // 오답 플래그 (필요하다면)
                feedbackMessage: `땡! ${appendJosa(selectedAnswer, '은/는')} 오답입니다. 다시 시도하세요. ${optionsText}. ${navText}`,
            }));
        }
    }, []);

    
    // --- TTS (음성 합성) 로직 시작 ---
    const handleSpeakFeedback = useCallback((textOverride?: string) => {
        // 기존에 나오고 있던 음성이 있다면 취소
        window.speechSynthesis.cancel();

        const textToSpeak = textOverride || quizStateRef.current.feedbackMessage;
        
        if (!textToSpeak) return;
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

    const numberToHangul = (num: number) => {
        const map = ["일", "이", "삼"]; 
        return map[num-1] || num; // 매핑된 게 없으면 그냥 숫자 반환
    };

    // 동물이 바뀌거나(animalIdx 변경) 컴포넌트가 언마운트될 때 음성 중지
    useEffect(() => {
        if (quizState.feedbackMessage && (mode === 'integrated' || (mode === 'category' && selectedCategory))) {
            const timer = setTimeout(() => {
                handleSpeakFeedback(quizState.feedbackMessage);
            }, 100);
        return () => clearTimeout(timer);
        }
    }, [quizState.feedbackMessage, mode, handleSpeakFeedback]);
    // --- TTS 로직 끝 ---   
    

    // --- 닷패드 키 및 SDk ---

    //F4 처리 로직
    const handleF4Key = useCallback(() => {
        if (clickTimerRef.current) {
            // 더블 클릭 감지
            clearTimeout(clickTimerRef.current);
            clickTimerRef.current=null;

            // 배속 순환 : 1 -> 2 -> 4 -> 1
            const currentRate = playbackRateRef.current;
            let nextRate = 1.0;

            if (currentRate === 1.0) nextRate = 2.0;
            else if (currentRate === 2.0) nextRate = 4.0;
            else nextRate = 1.0;
        
            // 상태 업데이트
            setPlaybackRate(nextRate);
            playbackRateRef.current = nextRate;

            setTimeout(() => handleSpeakFeedback(), 50);

        } else { 
            // 첫 번째 클릭 -> 타이머 시작
            clickTimerRef.current = setTimeout(() => {
                // 싱글 클릭(시간 초과) -> 현재 메시지 다시 출력
                handleSpeakFeedback();
                clickTimerRef.current = null;
            }, 500);
        }
    }, [handleSpeakFeedback]);

    const dotpadKeyCallback = useCallback(async (keyCode: string) => {
        const now = Date.now();
        if (now - lastKeyTimeRef.current < 100) return;
        lastKeyTimeRef.current = now;

        const currentQuiz = quizStateRef.current;      
        const currentAnimal= currentQuiz.currentAnimal;

        if ((mode !== 'integrated' && mode !== 'category') || !currentAnimal ) return; // 퀴즈 시작 전이거나 기기 연결 안되면 무시
        
        // F4 처리 로직
        if (keyCode === 'F4') { 
            handleF4Key(); 
            return ; }

        // 상태 2: 정답을 맞춘 후
        if (currentQuiz.isAnswered) { 
            switch (keyCode) {
                case 'F1' : if (currentAnimal?.f1) setViewMode('f1'); break;
                case 'F2' : if (currentAnimal?.f1) setViewMode('f2'); break;
                case 'F3' : if (currentAnimal?.f1) setViewMode('f3'); break;
                case 'Right' : case 'next': moveToNextQuestion(); break;
                case 'F4' : console.log("종료"); break;
            }
        } 
        // 상태 1: 정답 맞추기 전
        else {
            switch (keyCode) {
                case 'F1' : if (currentQuiz.options[0]) handleAnswer(currentQuiz.options[0]); break;
                case 'F2' : if (currentQuiz.options[1]) handleAnswer(currentQuiz.options[1]); break;
                case 'F3' : if (currentQuiz.options[2]) handleAnswer(currentQuiz.options[2]); break;
                case 'Left' : if (historyStateRef.current) moveToPreviousQuestion(); break;
            }
        }
    }, [mode, handleF4Key, handleAnswer, moveToNextQuestion, moveToPreviousQuestion]);
    
    // Quiz의 키 핸들러를 Dictionary에 등록
    useEffect(() => {
        const quizListener = (keycode: string) => {
            // 메뉴 모드일 때는 키 입력 무시
            if (mode === 'menu') return;
            
            // SDK의 keycode를 Quiz의 형식으로 변환
            const keyMap: Record<string, string> = {
                "1": "F1",
                "2": "F2", 
                "3": "F3",
                "4": "F4",
                "0": "Left",
                "5": "Right"
            };
            
            const mappedKey = keyMap[keycode];
            if (mappedKey) {
                dotpadKeyCallback(mappedKey);
            }
        };

        console.log('Quiz: 키 핸들러를 Dictionary에 등록');
        setQuizKeyHandler(() => quizListener);
        
        // 컴포넌트 언마운트 시 해제
        return () => {
            console.log('Quiz: 키 핸들러 해제');
            setQuizKeyHandler(null);
        };
    }, [mode, dotpadKeyCallback, setQuizKeyHandler]);
       
    useEffect(() => {
        if (mode ==='integrated') {
            if (!quizState.currentAnimal) loadNewQuestion(true);
        }
        else if (mode === 'category' && selectedCategory) {
            if (!quizState.currentAnimal) loadNewQuestion(true);
        }
    }, [connectedDevice, loadNewQuestion, mode, selectedCategory]);

    // 닷패드 데이터 전송
    const graphicHex = quizState.currentAnimal ? quizState.currentAnimal[viewMode] : "";

    useEffect(() => {
        if (!connectedDevice || !dotpadsdk.current) return;
        const updateDotPad = async () => {
            // 그래픽(이미지) 전송
            if (graphicHex) await dotpadsdk.current?.displayGraphicData(connectedDevice.target, graphicHex);
        };
        updateDotPad();
    }, [connectedDevice, graphicHex]);
    
    // ---- UI ----
    const startIntegratedMode = () => {
        setMode('integrated');
        loadNewQuestion(true);
    };

    const startCategoryMode = () => {
        setQuizState(prev => ({ ...prev, feedbackMessage: ""}));
        setMode('category');
    };

    const goBackToMenu = () => {
        window.speechSynthesis.cancel();
        setMode('menu');
        setSelectedCategory(null);

        setQuizState({
            currentAnimal : null,
            options: [],
            correctAnswer: "",
            isAnswered: false,
            isCorrect: false,
            feedbackMessage: "",
            questionNumber: 1,
        });
        
        setViewMode("f1");
        setHistoryState(null);
        setFutureState(null);
    };


    // ---- UI 렌더링 ----
    return (
        <div className="App">
            <h2>동물 퀴즈</h2>
            {mode === 'menu' && (
                <div className="menu-container" style= {{display: 'flex', gap:'20px', justifyContent:'center', marginTop:'50px'}}>
                <button
                    onClick={startIntegratedMode}
                    style={{padding:'30px', fontSize:'1.5rem', cursor:'pointer', borderRadius:'15px', background:'#4CAF50', color:'white', border:'none'}}
                >
                    통합 모드<br/><span style={{fontSize:'1rem'}}>(모든 종류의 동물들을 대상으로 퀴즈를 냅니다.)</span>
                </button>
                    
                <button
                    onClick={startCategoryMode}
                    style={{padding:'30px', fontSize:'1.5rem', cursor:'pointer', borderRadius:'15px', background:'#4CAF50', color:'white', border:'none'}}
                >
                    카테고리 모드<br/><span style={{fontSize:'1rem'}}>(원하는 종을 선택하여 퀴즈를 냅니다.)</span>
                </button>    
            </div>
        )}
        {(mode === 'integrated' || (mode === 'category' && selectedCategory)) && (
            <div className="quiz-container">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h2>
                        {mode === 'integrated' ? '통합 모드 랜덤 퀴즈' : `카테고리: ${selectedCategory}`}
                        </h2>
                    <button onClick={goBackToMenu} style={{padding:'5px 10px', background:'#888', color:'white', border:'none', borderRadius:'5px'}}>
                        메뉴로 나가기
                    </button>
                </div>
                <hr /> 

                {/* 퀴즈 디스플레이 영역 */}
                {quizState.currentAnimal ? (
                    <div className="quiz-area">
                        <DotPadDisplay
                            mainData={graphicHex}
                            subData=""
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
                            <></>
                        ) : (
                            <button className="button" onClick={() => loadNewQuestion(false)}>
                            다음 문제 (→)
                            </button>
                        )}
                        </div>
                    )}
                    </div>
                </div>
                ) : (
                <p>Dot Pad를 연결해주세요. 퀴즈가 시작됩니다.</p>
                )}

                {/* DotPad 물리적 버튼 매핑 (UI 없이 기능만) */}
                <div style= {{marginTop: '20px'}}>
                    <DotPadButtons 
                        onArrowButtonClick={(key) => dotpadKeyCallback(key === 'next' ? 'Right' : 'Left')}
                        onFunctionButtonClick={(key) => dotpadKeyCallback(key.toUpperCase())} 
                    />
                </div>

                {/* --- 음성 설명 버튼 및 텍스트 영역 --- */}
                <div style={{ margin: "15px 0", padding: "10px", border: "1px solid #ccc", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
                    
                    {/* 음성 듣기 메인 버튼 */}
                    <button 
                        onClick={() => handleSpeakFeedback()}
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
            </div>
        
    )}
    {mode === 'category' && !selectedCategory && (
        <div style={{textAlign:'center', marginTop:'50px'}}>
            <h3>카테고리를 선택하세요</h3>
            <div style={{display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap'}}>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => {
                            setSelectedCategory(cat);
                        }}
                        style={{padding:'15px 25px', fontSize:'1.2rem', borderRadius:'10px', cursor:'pointer'}}
                    >
                        {cat}
                    </button>
                    ))}
                </div>
                <br/>
                <button onClick={goBackToMenu} style={{padding:'5px 10px', background:'#888', color:'white', border:'none', borderRadius:'5px'}}>
                    메뉴로 나가기
                </button>
                </div>
            )}
        </div>
    );
}