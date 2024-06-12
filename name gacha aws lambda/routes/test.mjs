// index.js

exports.handler = async (event) => {
    try {
        const response = await axios.get('https://api.ipify.org?format=json'); // 외부 IP를 반환하는 간단한 API
        console.log('External IP:', response.data.ip); // 로그에 외부 IP 주소를 출력
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Successfully connected to the internet!',
                ip: response.data.ip,
            }),
        };
    } catch (error) {
        console.error('Error connecting to the internet:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to connect to the internet',
                error: error.message,
            }),
        };
    }
};
