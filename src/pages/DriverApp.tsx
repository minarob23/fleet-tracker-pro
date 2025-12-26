import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface GPSData {
    latitude: number;
    longitude: number;
    speed: number;
}

const DriverApp = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [deviceId, setDeviceId] = useState('GPS001');
    const [serverUrl, setServerUrl] = useState('http://192.168.100.2:3001/api/gps/webhook');
    const [interval, setInterval] = useState(30);
    const [isTracking, setIsTracking] = useState(false);
    const [status, setStatus] = useState<'default' | 'connecting' | 'active' | 'error'>('default');
    const [statusText, setStatusText] = useState('غير متصل');
    const [statusDetail, setStatusDetail] = useState('قم بإدخال المعلومات أدناه للبدء');
    const [gpsData, setGpsData] = useState<GPSData>({ latitude: 0, longitude: 0, speed: 0 });
    const [trackingInterval, setTrackingIntervalId] = useState<number | null>(null);
    const [watchId, setWatchId] = useState<number | null>(null);

    const updateStatus = (text: string, detail: string, type: 'default' | 'connecting' | 'active' | 'error') => {
        setStatusText(text);
        setStatusDetail(detail);
        setStatus(type);
    };

    const sendGPSData = async (position: GeolocationPosition) => {
        const data = {
            device_id: deviceId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            speed: position.coords.speed ? Math.round(position.coords.speed * 3.6) : 0,
            heading: position.coords.heading || 0,
            altitude: position.coords.altitude || 0,
            accuracy: position.coords.accuracy || 0,
            timestamp: new Date().toISOString()
        };

        setGpsData({
            latitude: data.latitude,
            longitude: data.longitude,
            speed: data.speed
        });

        try {
            const response = await fetch(serverUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                updateStatus('متصل ويعمل بنجاح ✓', `آخر إرسال: ${new Date().toLocaleTimeString('ar-EG')}`, 'active');
            } else {
                throw new Error(`خطأ في الخادم: ${response.status}`);
            }
        } catch (error) {
            updateStatus('خطأ في الاتصال ⚠️', (error as Error).message, 'error');
        }
    };

    const startTracking = () => {
        if (!navigator.geolocation) {
            alert('❌ المتصفح لا يدعم تحديد الموقع الجغرافي');
            return;
        }

        if (!deviceId || !serverUrl) {
            alert('⚠️ يرجى إدخال معرف الجهاز وعنوان الخادم');
            return;
        }

        setIsTracking(true);
        updateStatus('جاري الاتصال...', 'انتظر الحصول على الموقع (قد يستغرق 30 ثانية)', 'connecting');

        const id = navigator.geolocation.watchPosition(
            (position) => {
                sendGPSData(position);
            },
            (error) => {
                updateStatus('خطأ في GPS ⚠️', error.message, 'error');
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 0
            }
        );
        setWatchId(id);

        const intervalId = window.setInterval(() => {
            navigator.geolocation.getCurrentPosition(
                sendGPSData,
                (error) => {
                    console.error('خطأ في تحديد الموقع:', error.message);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 30000,
                    maximumAge: 0
                }
            );
        }, interval * 1000);
        setTrackingIntervalId(intervalId);
    };

    const stopTracking = () => {
        if (trackingInterval) {
            clearInterval(trackingInterval);
            setTrackingIntervalId(null);
        }

        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
        }

        setIsTracking(false);
        updateStatus('غير متصل', 'تم إيقاف التتبع', 'default');
    };

    useEffect(() => {
        return () => {
            if (trackingInterval) clearInterval(trackingInterval);
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        };
    }, [trackingInterval, watchId]);

    // Read device ID from URL parameter
    useEffect(() => {
        const deviceParam = searchParams.get('device');
        if (deviceParam) {
            setDeviceId(deviceParam);
        }
    }, [searchParams]);

    const getStatusIcon = () => {
        switch (status) {
            case 'active': return '🟢';
            case 'error': return '🔴';
            case 'connecting': return '⏳';
            default: return '📍';
        }
    };

    const getStatusClass = () => {
        switch (status) {
            case 'active': return 'from-green-600 to-emerald-600';
            case 'error': return 'from-red-600 to-rose-600';
            case 'connecting': return 'from-amber-600 to-yellow-600';
            default: return 'from-emerald-600 to-cyan-600';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-cyan-500 p-5">
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/')}
                        className="gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        العودة للوحة التحكم
                    </Button>
                </div>

                <h1 className="text-4xl font-bold text-center text-emerald-600 dark:text-emerald-400 mb-2">
                    🚛 تطبيق تتبع السائق
                </h1>
                <p className="text-center text-gray-600 dark:text-gray-400 text-lg font-semibold mb-8">
                    ONICL - نظام التتبع
                </p>

                {/* Status Card */}
                <div className={`bg-gradient-to-br ${getStatusClass()} text-white p-6 rounded-2xl mb-6 text-center shadow-lg`}>
                    <div className="text-6xl mb-4">{getStatusIcon()}</div>
                    <div className="text-2xl font-bold mb-2">{statusText}</div>
                    <div className="text-base opacity-95">{statusDetail}</div>
                </div>

                {!isTracking ? (
                    /* Setup Form */
                    <div className="space-y-6">
                        {/* Instructions */}
                        <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-5">
                            <h3 className="text-blue-900 dark:text-blue-300 font-bold text-lg mb-3">📋 تعليمات الاستخدام:</h3>
                            <ol className="mr-5 text-blue-900 dark:text-blue-300 space-y-2">
                                <li>أدخل <strong>معرف الجهاز</strong> الخاص بك (مثل: GPS001)</li>
                                <li>أدخل <strong>عنوان الخادم</strong> (اسأل المدير)</li>
                                <li>اختر <strong>فترة الإرسال</strong> (30 ثانية موصى بها)</li>
                                <li>اضغط على <strong>"بدء التتبع"</strong></li>
                            </ol>
                        </div>

                        {/* Device ID */}
                        <div>
                            <label className="block text-emerald-800 dark:text-emerald-300 font-bold mb-2 text-lg">
                                معرف الجهاز (Device ID)
                            </label>
                            <span className="block text-gray-600 dark:text-gray-400 text-sm mb-2 italic">
                                مثال: GPS001 أو GPS002
                            </span>
                            <input
                                type="text"
                                value={deviceId}
                                onChange={(e) => setDeviceId(e.target.value)}
                                placeholder="GPS001"
                                className="w-full p-4 border-3 border-emerald-200 dark:border-emerald-800 rounded-xl text-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-700 transition-all"
                            />
                        </div>

                        {/* Server URL */}
                        <div>
                            <label className="block text-emerald-800 dark:text-emerald-300 font-bold mb-2 text-lg">
                                عنوان الخادم (Server URL)
                            </label>
                            <span className="block text-gray-600 dark:text-gray-400 text-sm mb-2 italic">
                                اسأل المدير عن العنوان الصحيح
                            </span>
                            <input
                                type="text"
                                value={serverUrl}
                                onChange={(e) => setServerUrl(e.target.value)}
                                placeholder="http://192.168.100.2:3001/api/gps/webhook"
                                className="w-full p-4 border-3 border-emerald-200 dark:border-emerald-800 rounded-xl text-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-700 transition-all"
                            />
                        </div>

                        {/* Interval */}
                        <div>
                            <label className="block text-emerald-800 dark:text-emerald-300 font-bold mb-2 text-lg">
                                فترة الإرسال (بالثواني)
                            </label>
                            <span className="block text-gray-600 dark:text-gray-400 text-sm mb-2 italic">
                                كل كم ثانية يتم إرسال الموقع (30 موصى بها)
                            </span>
                            <input
                                type="number"
                                value={interval}
                                onChange={(e) => setInterval(parseInt(e.target.value))}
                                placeholder="30"
                                min="10"
                                max="300"
                                className="w-full p-4 border-3 border-emerald-200 dark:border-emerald-800 rounded-xl text-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-700 transition-all"
                            />
                        </div>

                        <Button
                            onClick={startTracking}
                            className="w-full py-6 text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg"
                        >
                            🚀 بدء التتبع
                        </Button>
                    </div>
                ) : (
                    /* Tracking Info */
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            {/* Latitude */}
                            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-5 rounded-xl text-center border-2 border-emerald-200 dark:border-emerald-800">
                                <div className="text-emerald-700 dark:text-emerald-400 text-sm font-semibold mb-2">خط العرض</div>
                                <div className="text-emerald-900 dark:text-emerald-300 text-2xl font-bold">
                                    {gpsData.latitude ? gpsData.latitude.toFixed(6) : '--'}
                                </div>
                            </div>

                            {/* Longitude */}
                            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-5 rounded-xl text-center border-2 border-emerald-200 dark:border-emerald-800">
                                <div className="text-emerald-700 dark:text-emerald-400 text-sm font-semibold mb-2">خط الطول</div>
                                <div className="text-emerald-900 dark:text-emerald-300 text-2xl font-bold">
                                    {gpsData.longitude ? gpsData.longitude.toFixed(6) : '--'}
                                </div>
                            </div>

                            {/* Speed */}
                            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-5 rounded-xl text-center border-2 border-emerald-200 dark:border-emerald-800">
                                <div className="text-emerald-700 dark:text-emerald-400 text-sm font-semibold mb-2">السرعة (كم/س)</div>
                                <div className="text-emerald-900 dark:text-emerald-300 text-2xl font-bold">
                                    {gpsData.speed}
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={stopTracking}
                            variant="destructive"
                            className="w-full py-6 text-xl font-bold shadow-lg"
                        >
                            ⏹️ إيقاف التتبع
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DriverApp;
