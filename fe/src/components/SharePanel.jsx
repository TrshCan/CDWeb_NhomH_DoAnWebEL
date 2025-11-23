import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getPublicShareLink, getSurveyShares, inviteByEmail, deleteShare } from "../api/shares";

export default function SharePanel({ surveyId }) {
  const [showQR, setShowQR] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Load share link và danh sách shares
  useEffect(() => {
    const loadShares = async () => {
      if (!surveyId) return;
      
      try {
        setLoading(true);
        const [linkData, sharesData] = await Promise.all([
          getPublicShareLink(surveyId),
          getSurveyShares(surveyId)
        ]);
        
        setShareLink(linkData);
        setShares(sharesData);
      } catch (error) {
        console.error("Error loading shares:", error);
        toast.error("Không thể tải thông tin chia sẻ");
      } finally {
        setLoading(false);
      }
    };

    loadShares();
  }, [surveyId]);

  const handleCopyLink = () => {
    if (!shareLink?.share_url) return;
    navigator.clipboard.writeText(shareLink.share_url);
    toast.success("Đã sao chép link");
  };

  const generateQRCode = () => {
    if (!shareLink?.share_url) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(shareLink.share_url)}`;
  };

  const handleInviteByEmail = async () => {
    if (!emailInput.trim()) {
      toast.error("Vui lòng nhập email");
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      toast.error("Email không hợp lệ");
      return;
    }

    try {
      setSendingEmail(true);
      const newShare = await inviteByEmail(surveyId, emailInput);
      setShares([newShare, ...shares]);
      setEmailInput("");
      toast.success(`Đã gửi lời mời đến ${emailInput}`);
    } catch (error) {
      toast.error(error.message || "Không thể gửi lời mời");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDeleteShare = async (shareId) => {
    if (!confirm("Bạn có chắc muốn xóa chia sẻ này?")) return;

    try {
      await deleteShare(shareId);
      setShares(shares.filter(s => s.id !== shareId));
      toast.success("Đã xóa chia sẻ");
    } catch (error) {
      toast.error("Không thể xóa chia sẻ");
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto p-8 bg-white">
      <div className="flex gap-6 flex-shrink-0 pl-4">
        
        {/* Section 1: Select how you want to share your survey - 493x292 */}
        <div 
          className="bg-white rounded-lg border border-gray-200 p-6 flex-shrink-0" 
          style={{ width: '493px', height: '292px', minWidth: '493px', minHeight: '292px', maxWidth: '493px', maxHeight: '292px' }}
        >
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Select how you want to share your survey
          </h2>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 13C10.4295 13.5741 10.9774 14.0491 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9923C14.3618 15.0435 15.0796 14.9403 15.7513 14.6897C16.4231 14.4392 17.0331 14.047 17.54 13.54L20.54 10.54C21.4508 9.59695 21.9548 8.33394 21.9434 7.02296C21.932 5.71198 21.4061 4.45791 20.4791 3.53087C19.5521 2.60383 18.298 2.07799 16.987 2.0666C15.676 2.0552 14.413 2.55918 13.47 3.46997L11.75 5.17997"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 11C13.5705 10.4259 13.0226 9.95083 12.3934 9.60707C11.7642 9.26331 11.0685 9.05889 10.3533 9.00768C9.63816 8.95646 8.92037 9.05965 8.24861 9.31023C7.57685 9.5608 6.96684 9.95303 6.45996 10.46L3.45996 13.46C2.54917 14.403 2.04519 15.666 2.05659 16.977C2.06798 18.288 2.59382 19.5421 3.52086 20.4691C4.4479 21.3961 5.70197 21.922 7.01295 21.9334C8.32393 21.9448 9.58694 21.4408 10.53 20.53L12.24 18.82"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                Anyone with link
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Anyone with the link to this survey can access.
              </p>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareLink?.share_url || ""}
                  className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded bg-gray-50 text-gray-700 truncate"
                />
                <button
                  onClick={handleCopyLink}
                  disabled={!shareLink}
                  className="px-4 py-2 bg-violet-600 text-white text-xs font-medium rounded hover:bg-violet-700 transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sao chép
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: QR Code - 235x292 */}
        <div 
          className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col flex-shrink-0" 
          style={{ width: '235px', height: '292px', minWidth: '235px', minHeight: '292px', maxWidth: '235px', maxHeight: '292px' }}
        >
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            QR Code
          </h2>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            {showQR ? (
              <div className="flex flex-col items-center gap-3">
                <img
                  src={generateQRCode()}
                  alt="QR Code"
                  className="border-2 border-gray-300 rounded flex-shrink-0"
                  style={{ width: '170px', height: '170px', minWidth: '170px', minHeight: '170px' }}
                />
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = generateQRCode();
                    link.download = `survey-${surveyId}-qr.png`;
                    link.click();
                    toast.success("Đã tải mã QR");
                  }}
                  className="w-full px-3 py-2 text-violet-600 border border-violet-600 rounded hover:bg-violet-50 transition text-xs font-medium"
                >
                  Tải mã QR
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowQR(true)}
                className="px-5 py-2.5 bg-violet-600 text-white rounded hover:bg-violet-700 transition text-sm font-medium"
              >
                Hiển thị mã QR
              </button>
            )}
          </div>
        </div>

        {/* Section 3: Mời qua email - 400x292 */}
        <div 
          className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col flex-shrink-0" 
          style={{ width: '400px', minWidth: '400px', maxWidth: '400px' }}
        >
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Mời người tham gia
          </h2>
          
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleInviteByEmail()}
                placeholder="example@email.com"
                className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                onClick={handleInviteByEmail}
                disabled={sendingEmail || !emailInput.trim()}
                className="px-4 py-2 bg-violet-600 text-white text-xs font-medium rounded hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {sendingEmail ? "Đang gửi..." : "Gửi"}
              </button>
            </div>
          </div>

          {/* Danh sách người đã mời */}
          <div className="flex-1 overflow-y-auto">
            <h3 className="text-xs font-medium text-gray-700 mb-2">
              Đã mời ({shares.filter(s => s.share_type === 'email').length})
            </h3>
            <div className="space-y-2">
              {shares.filter(s => s.share_type === 'email').map((share) => (
                <div key={share.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{share.email}</p>
                    <p className="text-gray-500">
                      {share.status === 'completed' ? '✓ Đã hoàn thành' : 'Chờ phản hồi'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteShare(share.id)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {shares.filter(s => s.share_type === 'email').length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">
                  Chưa có lời mời nào
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
