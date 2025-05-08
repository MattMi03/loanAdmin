import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:8888/api',
    headers: {
        Accept: "*/*",
    }
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    }
);


// 登录接口
export const loginAPI = async (loginData) => {
    try {
        const response = await apiClient.post('/auth/admin/login', loginData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.msg || error.message);
    }
}

// 获取用户信息
export const getSelfInfoAPI = async () => {
    try {
        const response = await apiClient.get('/admin/users/getSelf');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.msg || error.message);
    }
}

// 改密码
export const changePasswordAPI = async (payload) => {
    try {
        const response = await apiClient.post('/admin/users/updatePassword', payload);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.msg || error.message);
    }
}

// 获取贷款统计数据
export const getStatisticsAPI = async (startDate, endDate) => {
    try {
        const response = await apiClient.get('/admin/statistics/all', {
            params: { startDate, endDate }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.msg || error.message);
    }
};

// 获取产品列表
export const fetchProductAPI = async (currentPage, pageSize, filterStatus) => {
    try {
        let path = '/admin/products/list';
        let url = `${path}?page=${currentPage - 1}&size=${pageSize}`;

        if (filterStatus !== 'all') {
            path = '/admin/products/status';
            url = `${path}?status=${filterStatus.toLowerCase()}&page=${currentPage - 1}&size=${pageSize}`;
        }

        const headers = await getSignatureHeaders('/api' + path);

        const response = await apiClient.get(url, {
            headers,
        });

        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.msg || error.message);
    }
};

export const getSignatureHeaders = async (path) => {
    const clientId = generateClientId(); // 自定义一个 clientId 生成函数
    console.log('clientId', clientId);
    const response = await apiClient.get('/admin/auth/signature', {
        params: { path, client_id: clientId }
    });

    const { key } = response.data;
    const timestamp = Date.now().toString();

    const body = ''; // 如果你有 body 传参，就填真实 body 字符串

    const base64 = btoa(
        Object.entries(
            Object.fromEntries(
                new URLSearchParams(body) // 或者用 JSON.parse/排序等方式
            )
        ).sort().map(([k, v]) => `${k}=${v}`).join('&')
    );

    const signRaw = `${base64}&timestamp=${timestamp}&key=${key}`;
    const signature = await sha256Twice(signRaw);

    return {
        'X-Signature': signature,
        'X-Timestamp': timestamp,
        'X-Client-ID': clientId,
    };
};

function isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i * i <= n; i++) {
        if (n % i === 0) return false;
    }
    return true;
}

function isPowerOfPrime(sum) {
    for (let base = 2; base <= sum; base++) {
        if (!isPrime(base)) continue;
        let power = base;
        while (power < sum) {
            power *= base;
            if (power === sum) return true;
        }
    }
    return false;
}

function generatePart() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const isLetter = (c) => /[a-z]/.test(c);

    while (true) {
        const len = Math.floor(Math.random() * 3) + 6; // 6 ~ 8
        let part = '';
        const used = new Set();

        while (part.length < len) {
            const c = chars[Math.floor(Math.random() * chars.length)];
            if (!used.has(c)) {
                part += c;
                used.add(c);
            }
        }

        if (!isLetter(part[0]) || !isLetter(part[part.length - 1])) continue;

        const sum = [...part].reduce((a, b) => a + b.charCodeAt(0), 0);
        if (isPowerOfPrime(sum)) return { part, sum };
    }
}

function generateClientId() {
    while (true) {
        const p1 = generatePart();
        const p2 = generatePart();
        const p3 = generatePart();

        const total = p1.sum + p2.sum + p3.sum;
        if (isPrime(total)) {
            return `${p1.part}_${p2.part}_${p3.part}`;
        }
    }
}

async function sha256Twice(str) {
    const first = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    const second = await crypto.subtle.digest('SHA-256', first);
    return [...new Uint8Array(second)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// 创建或更新产品
export const submitProductAPI = async (payload, isEditMode) => {
    try {
        const url = isEditMode ? '/admin/products/update' : '/admin/products/create';
        await apiClient.post(url, payload, {
            headers: {
                "Content-Type": "application/json",
            }
        });
    } catch (error) {
        throw new Error(error.response?.data?.msg || error.message);
    }
};

// 修改产品状态
export const toggleProductStatusAPI = async (id, targetStatus) => {
    try {
        await apiClient.post(`/admin/products/online?product_id=${id}`, null, {
            headers: {
                "Content-Type": "application/json",
            }
        });
    } catch (error) {
        throw new Error(error.response?.data?.msg || error.message);
    }
};

// 获取用户反馈列表
export const fetchFeedbackAPI = async (currentPage, pageSize, filterStatus) => {
    try {
        let url = `/admin/feedback/list?page=${currentPage - 1}&size=${pageSize}`;

        if (filterStatus !== 'all') {
            url = `/admin/feedback/status?status=${filterStatus}&page=${currentPage - 1}&size=${pageSize}`;
        }

        const response = await apiClient.get(url);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.msg || error.message);
    }
};

// 提交反馈回复
export const submitFeedbackReplyAPI = async (selectedFeedbackId, replyContent) => {
    try {
        const response = await apiClient.post(
            '/admin/feedback/reply',
            {
                id: selectedFeedbackId,
                reply: replyContent
            }
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.msg || error.message);
    }
};

// 获取申请列表
export const fetchApplicationAPI = async (currentPage, pageSize, filterStatus) => {
    try {
        let url = `/admin/apply/list?page=${currentPage - 1}&size=${pageSize}`;

        if (filterStatus !== 'all') {
            url = `/admin/apply/status?status=${filterStatus}&page=${currentPage - 1}&size=${pageSize}`;
        }

        const response = await apiClient.get(url);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.msg || error.message);
    }
};

// 根据用户ID获取申请列表
export const fetchApplicationByUserIdAPI = async (userId, currentPage, pageSize, filterStatus) => {
    try {
        const response = await apiClient.get(`/admin/apply/user?userId=${userId}&page=${currentPage - 1}&size=${pageSize}&status=${filterStatus}`);
        return response.data;
    }
    catch (error) {
        throw new Error(error.response?.data?.msg || error.message);
    }
};

// 根据贷款ID获取申请详情
export const fetchApplicationByIdAPI = async (applyId) => {
    try {
        const response = await apiClient.get(`/admin/apply/get?applyId=${applyId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.msg || error.message);
    }
};

// 审批
export const auditApplicationAPI = async (applyId, status, comment) => {
    try {
        const response = await apiClient.post('/admin/apply/audit', {
            applyId,
            status,
            comment
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.msg || error.message);
    }
};

export const getAuitByApplyIdAPI = async (applyId) => {
    try{
        const response = await apiClient.get(`/admin/apply/audit/record?applyId=${applyId}`);
        return response.data;
    }
    catch (error) {
        throw new Error(error.response?.data?.msg || error.message);
    }
}

// 放款
export const loanApplicationAPI = async (applyId, amount) => {
    try {
        const response = await apiClient.post('/admin/apply/loan', {
            applyId,
            amount
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.msg || error.message);
    }
}

// 还款计划
export const getRepaymentPlanAPI = async (applyId) => {
    try {
        const response = await apiClient.get(`/admin/repayments/get?loanId=${applyId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.msg || error.message);
    }
}

export const getRepaymentHistoryAPI = async (applyId) => {
    try {
        const response = await apiClient.get(`/admin/repayments/history?loanId=${applyId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.msg || error.message);
    }
}

// 下载合同
export const downloadContractAPI = async (applyId) => {
    try {
        const response = await apiClient.get(`/admin/apply/contract/download?applyId=${applyId}`, {
            responseType: 'blob',
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.msg || error.message);
    }
};

// 获取用户列表
export const fetchUserAPI = async (currentPage, pageSize, filterStatus) => {
    try {
        let url = `/admin/users/list?page=${currentPage - 1}&size=${pageSize}`;

        if (filterStatus !== 'all') {
            url = `/admin/users/status?verified=${filterStatus}&page=${currentPage - 1}&size=${pageSize}`;
        }

        const response = await apiClient.get(url);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.msg || error.message);
    }
};

// 根据用户ID获取用户详情
export const fetchUserByIdAPI = async (userId) => {
    try {
        const response = await apiClient.get(`/admin/users/get?userId=${userId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.msg || error.message);
    }
};

// 获取放款记录
export const fetchDisbursementAPI = async (currentPage, pageSize) => {
    try {
        const response = await apiClient.get(`/admin/apply/disbursement/list?page=${currentPage - 1}&size=${pageSize}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.msg || error.message);
    }
}

export const fetchDisbursementByApplyIdAPI = async (applyId) => {
    try {
        const response = await apiClient.get(`/admin/apply/disbursement/get?applyId=${applyId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.msg || error.message);
    }
}