import React, { useState, useEffect, useRef } from 'react';

// --- SVG Icons --- //
// Using inline SVGs to keep everything in one file.

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m0 18a9 9 0 009-9m-9 9a9 9 0 00-9-9" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const ReturnIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15l-3-3m0 0l3-3m-3 3h12a6 6 0 000-12h-3" />
    </svg>
);

const DotsHorizontalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
  </svg>
);

const PlusIcon = ({ className = "h-6 w-6 text-white" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const ChevronUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
);

const DuplicateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 hover:text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const ChevronUpSideIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 hover:bg-gray-200 p-1 rounded cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
);

const ChevronDownSideIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 hover:bg-gray-200 p-1 rounded cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

const XIcon = ({ className = "h-6 w-6 text-white" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

// --- Modal Icons --- //
const MinusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>;
const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;
const SortIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h9m-9 4h13m-5-4v8m0 0l-4-4m4 4l4-4" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const TextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg>;
const NumberIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>;


// --- Components --- //

const EditableField = ({ placeholder, initialValue = '', inputClassName = '', isTextarea = false }) => {
    const [value, setValue] = useState(initialValue);
    const commonClasses = "w-full bg-transparent focus:outline-none rounded-md p-2 -ml-2 focus:bg-black/5 transition-colors duration-200 resize-none";
    const InputComponent = isTextarea ? 'textarea' : 'input';

    return (
        <InputComponent
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className={`${commonClasses} ${inputClassName}`}
            rows={isTextarea ? 1 : undefined}
        />
    );
};

const SectionHeader = ({ title, badge, children, onClick, isCollapsed }) => (
    <div className="flex items-center text-gray-600 mb-4 cursor-pointer" onClick={onClick}>
        <div className={`transition-transform duration-300 ${!isCollapsed ? 'rotate-0' : '-rotate-90'}`}>
            <ChevronUpIcon />
        </div>
        <h2 className="text-md font-semibold ml-2 mr-3">{title}</h2>
        {badge && (
            <span className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                {badge}
            </span>
        )}
        <div className="ml-auto">
            {children}
        </div>
    </div>
);

const WelcomeSection = ({ isActive, onClick }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    return (
        <div className="mb-8 group">
            <SectionHeader title="Màn hình chào mừng" isCollapsed={isCollapsed} onClick={() => setIsCollapsed(!isCollapsed)} />
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0' : 'max-h-[1000px]'}`} onClick={onClick}>
                 <div className={`bg-violet-50 border-2 rounded-lg p-8 transition-colors duration-300 shadow-lg ${isActive ? 'border-violet-600' : 'border-transparent group-hover:border-violet-600'}`}>
                    <div className="mb-8 text-left">
                        <a href="#" className="text-sm text-violet-600 font-semibold hover:underline">
                        <GlobeIcon />
                        Thay đổi ngôn ngữ Tiếng Việt - Tiếng Việt
                        <ChevronDownIcon />
                        </a>
                    </div>
                    <EditableField placeholder="Welcome title" inputClassName="text-4xl font-bold text-gray-800 mb-4" />
                    <EditableField placeholder="Welcome description" inputClassName="text-lg text-gray-600 mb-4" isTextarea />
                    <p className="text-gray-500 mb-6 text-left">Có 1 câu hỏi trong cuộc khảo sát này.</p>
                    <div className="flex items-center">
                        <button className="bg-emerald-500 text-white font-bold py-2 px-4 rounded-md hover:bg-emerald-600 transition-colors">Bắt đầu khảo sát</button>
                        <span className="ml-4 text-gray-600">hoặc nhấn<ReturnIcon /></span>
                    </div>
                </div>
            </div>
        </div>
    )
};

/**
 * Component mới để render một câu hỏi
 * Nhận logic điều khiển (mũi tên lên/xuống)
 */
const QuestionItem = ({ isActive, onClick, question, index, totalQuestions, moveQuestionItem }) => {
    return (
        <div className="relative mb-2"> {/* THAY ĐỔI: Giảm mb-4 thành mb-2 để các item gần nhau hơn */}
            <div onClick={onClick} className={`bg-white border-2 rounded-lg shadow-lg p-6 pb-12 transition-colors duration-300 cursor-pointer ${isActive ? 'border-violet-600' : 'border-transparent'} hover:border-violet-600`}> {/* THAY ĐỔI: Bỏ group-hover, thêm hover:border-violet-600 */}
                <div className="flex items-baseline">
                    <span className="text-violet-600 font-semibold mr-2 whitespace-nowrap">{question.id} →</span>
                    <div className='w-full'>
                        <EditableField placeholder="Your question here" initialValue={question.text} inputClassName="text-lg text-gray-800" />
                        <EditableField placeholder="Optional help description" initialValue={question.helpText} inputClassName="text-sm text-gray-500 mt-1" />
                    </div>
                </div>
                 {isActive && (
                    <>
                        <div className="mt-6">
                            <button className="flex items-center text-violet-600 font-semibold text-sm hover:text-violet-800 transition-colors">
                                <PlusIcon className="h-5 w-5 mr-1" />
                                Thêm câu hỏi phụ
                            </button>
                        </div>
                        <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                            <button className="p-1 rounded-md hover:bg-gray-100"><DuplicateIcon /></button>
                            <button className="p-1 rounded-md hover:bg-gray-100"><TrashIcon /></button>
                        </div>
                    </>
                )}
            </div>
            {isActive && (
                <div className="absolute top-1/2 -right-12 -translate-y-1/2 flex flex-col items-center space-y-1 bg-white p-1 rounded-md shadow-lg border border-gray-200">
                    <button
                        onClick={(e) => { e.stopPropagation(); moveQuestionItem(index, 'up'); }}
                        disabled={index === 0}
                        className={index === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                    ><ChevronUpSideIcon /></button>
                    <button
                        onClick={(e) => { e.stopPropagation(); moveQuestionItem(index, 'down'); }}
                        disabled={index === totalQuestions - 1}
                        className={index === totalQuestions - 1 ? 'opacity-50 cursor-not-allowed' : ''}
                    ><ChevronDownSideIcon /></button>
                </div>
            )}
        </div>
    );
};


const QuestionSection = ({ questionItems, moveQuestionItem, activeSection, handleSetSection }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const menuRef = useRef(null);

    const handleMenuToggle = (e) => { e.stopPropagation(); setIsMenuOpen(prev => !prev); }

    useEffect(() => {
        const handleClickOutside = (event) => { if (menuRef.current && !menuRef.current.contains(event.target)) { setIsMenuOpen(false); } };
        document.addEventListener("mousedown", handleClickOutside);
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, [menuRef]);

    return (
      <div className="mb-8"> {/* THAY ĐỔI: Bỏ class 'group' */}
        <SectionHeader title="Nhóm câu hỏi đầu tiên của tôi" badge={questionItems.length} isCollapsed={isCollapsed} onClick={() => setIsCollapsed(!isCollapsed)}>
            <div className="relative" ref={menuRef}>
                <button onClick={handleMenuToggle}><DotsHorizontalIcon /></button>
                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-sm z-10 border border-gray-100">
                        <ul className="py-2">
                            <li><button className="text-left w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-semibold">DUPLICATE GROUP</button></li>
                            <li><button className="text-left w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 font-semibold">DELETE GROUP</button></li>
                        </ul>
                    </div>  
                )}
            </div>
        </SectionHeader>
           <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0' : 'max-h-[1000px]'}`}>
            
            {/* Render danh sách các câu hỏi */}
            {questionItems.map((question, index) => (
                 <QuestionItem
                    key={question.id}
                    question={question}
                    index={index}
                    totalQuestions={questionItems.length}
                    isActive={activeSection === `question-${question.id}`}
                    onClick={() => handleSetSection(`question-${question.id}`)}
                    moveQuestionItem={moveQuestionItem}
                 />
            ))}
           
        </div>
      </div>
    );
};

const AddSection = ({ onAddClick, isModalOpen }) => ( // Thêm lại prop isModalOpen
    <div className="flex items-center my-2">
        <div className="flex-grow border-t-2 border-violet-400"></div>
        <button onClick={onAddClick} className="mx-4 bg-violet-600 p-2 rounded-full hover:bg-violet-700 transition-colors shadow-md">
             {isModalOpen ? <XIcon /> : <PlusIcon />} {/* Hiển thị X hoặc + */}
        </button>
        <div className="flex-grow border-t-2 border-violet-400"></div>
    </div>
);

const EndSection = ({ isActive, onClick }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    return (
        <div className="mt-8 group" >
             <SectionHeader title="Màn hình kết thúc" isCollapsed={isCollapsed} onClick={() => setIsCollapsed(!isCollapsed)}/>
             <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0' : 'max-h-[1000px]'}`} onClick={onClick}>
                <div className={`bg-sky-50 border-2 rounded-lg p-8 transition-colors duration-300 shadow-lg ${isActive ? 'border-violet-600' : 'border-transparent group-hover:border-violet-600'}`}>
                    <EditableField placeholder="Enter your end message here." inputClassName="text-lg text-gray-500 mb-6" isTextarea />
                    <button className="bg-emerald-500 text-white font-bold py-2 px-4 rounded-md hover:bg-emerald-600 transition-colors">
                        Hoàn thành
                    </button>
                </div>
             </div>
        </div>
    )
};

// --- Thêm lại QuestionTypeModal --- //
const QuestionTypeModal = ({ isOpen, onClose, onSelectQuestionType }) => {
    if (!isOpen) return null;

    const modalOptions = [
        { title: 'Chọn một đáp án', icon: <MinusIcon />, options: ['Danh sách (nút chọn)', 'Lựa chọn 5 điểm', 'Danh sách thả xuống'] },
        { title: 'Nhiều lựa chọn', icon: <ListIcon />, options: ['Nhiều lựa chọn', 'Nút lựa chọn nhiều'] },
        { title: 'Xếp hạng & Đánh giá', icon: <SortIcon />, options: ['Xếp hạng năng cao', 'Có/Không'] },
        { title: 'Ngày & dữ liệu', icon: <CalendarIcon />, options: ['Ngày giờ'] },
        { title: 'Văn bản', icon: <TextIcon />, options: ['Văn bản ngắn', 'Văn bản dài'] },
        { title: 'Số', icon: <NumberIcon />, options: ['Đầu vào dạng số'] },
    ];
    
    // Hàm xử lý khi nhấp vào một loại câu hỏi
    const handleSelect = (optionType) => {
        onSelectQuestionType(optionType); // Gọi hàm từ App
    };

    return (
        <div className="fixed inset-0 bg-black/30 z-10" onClick={onClose}>
            <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[calc(100vh-5rem)] overflow-y-auto p-6 border border-gray-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center border-b pb-4 mb-6">
                    <SearchIcon />
                    <input type="text" placeholder="Tìm loại câu hỏi" className="w-full ml-3 focus:outline-none text-lg" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {modalOptions.map(cat => (
                        <div key={cat.title}>
                            <div className="flex items-center mb-3">
                                {cat.icon}
                                <h3 className="font-bold text-gray-700 ml-2">{cat.title}</h3>
                            </div>
                            <ul>
                                {cat.options.map(opt => (
                                    <li key={opt}>
                                        <button 
                                            onClick={() => handleSelect(opt)} 
                                            className="block text-violet-600 hover:underline py-1 text-left"
                                        >
                                            {opt}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


export default function App() {
  const [activeSection, setActiveSection] = useState(null); 
  const [isModalOpen, setIsModalOpen] = useState(false); // Thêm lại state modal
  
  // State này giờ sẽ lưu danh sách các câu hỏi
  const [questionItems, setQuestionItems] = useState([
    { id: 1, text: "Câu hỏi của bạn ở đây", helpText: "Mô tả trợ giúp tùy chọn", type: "Mặc định" },
  ]);

  const handleSetSection = (sectionId) => {
      setActiveSection(sectionId);
  }

  // Thêm lại hàm toggle modal
  const handleToggleModal = () => {
      setIsModalOpen(!isModalOpen);
  }

  // Hàm để di chuyển câu hỏi (không thay đổi)
  const moveQuestionItem = (index, direction) => {
    setQuestionItems(prevItems => {
      const newItems = [...prevItems];
      const [removed] = newItems.splice(index, 1);
      if (direction === 'up' && index > 0) {
        newItems.splice(index - 1, 0, removed);
      } else if (direction === 'down' && index < newItems.length) { // Sửa lỗi logic nhỏ, không phải newItems.length - 1
        newItems.splice(index + 1, 0, removed);
      } else {
        // Nếu không di chuyển, trả lại mảng ban đầu
        return prevItems;
      }
      
      // Cập nhật ID
      const updatedItems = newItems.map((item, i) => ({
         ...item,
         id: i + 1
      }));
      
      // Cập nhật activeSection để trỏ đến ID mới của item vừa di chuyển
      const newActiveId = updatedItems.find(item => item.text === removed.text)?.id; // Tìm item dựa trên nội dung (cách đơn giản)
      if (newActiveId) {
          setActiveSection(`question-${newActiveId}`);
      }
      
      return updatedItems;
    });
  };
  
  // Hàm để thêm câu hỏi mới
  const addQuestionItem = (questionType = "Mặc định") => {
      setQuestionItems(prevItems => {
          const newId = prevItems.length > 0 ? Math.max(...prevItems.map(i => i.id)) + 1 : 1;
          const newItem = { 
              id: newId, 
              text: `Câu hỏi mới (${questionType})`, 
              helpText: "Mô tả trợ giúp tùy chọn",
              type: questionType
          };
          const newItems = [...prevItems, newItem];
          
          // Tự động active câu hỏi vừa thêm
          setActiveSection(`question-${newId}`);
          return newItems.map((item, index) => ({ // Cập nhật lại ID tuần tự
             ...item,
             id: index + 1
          }));
      });
  };
  
  // Hàm này được gọi từ modal
  const handleSelectQuestionType = (questionType) => {
      handleToggleModal(); // Đóng modal
      addQuestionItem(questionType); // Thêm câu hỏi với type đã chọn
  };

  return (
    <>
        <div className="min-h-screen bg-gray-100 flex justify-center p-4 font-sans" onClick={() => setActiveSection(null)}>
          <div className="w-full max-w-3xl mx-auto" onClick={(e) => e.stopPropagation()}>
            <WelcomeSection isActive={activeSection === 'welcome'} onClick={() => handleSetSection('welcome')} />

            {/* Render một QuestionSection duy nhất, truyền vào danh sách câu hỏi */}
            <QuestionSection
                questionItems={questionItems}
                moveQuestionItem={moveQuestionItem}
                activeSection={activeSection}
                handleSetSection={handleSetSection}
            />

            {/* Nút + giờ sẽ mở modal */}
            <AddSection onAddClick={handleToggleModal} isModalOpen={isModalOpen} />
            
            <EndSection isActive={activeSection === 'end'} onClick={() => handleSetSection('end')} />
          </div>
        </div>
        
        {/* Render Modal */}
        <QuestionTypeModal 
            isOpen={isModalOpen} 
            onClose={handleToggleModal}
            onSelectQuestionType={handleSelectQuestionType}
        /> 
    </>
  );
}

