import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        Accept: "*/*",
        Authorization: 
            "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MiwidXNlclR5cGUiOiJBRE1JTiJ9.IhHD01FyZGH9xfXwAckZwhJRiO77MqXAKRdWHeiRc4w",
    }
});

// 获取产品列表
export const fetchProductAPI = async (currentPage, pageSize, filterStatus) => {
    try {
        let url = `/admin/products/list?page=${currentPage - 1}&size=${pageSize}`;

        if (filterStatus !== 'all') {
            url = `/admin/products/status?status=${filterStatus.toLowerCase()}&page=${currentPage - 1}&size=${pageSize}`;
        }

        const response = await apiClient.get(url);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.msg || error.message);
    }
};

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
        await apiClient.post('/admin/products/online', id.toString(), {
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