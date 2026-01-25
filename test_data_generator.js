import axios from 'axios';

const BACKEND_URL = 'http://127.0.0.1:8080/api/submit-person';

const FAMILY_NAMES = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '蒋', '沈', '韩', '杨'];
const GIVEN_NAMES = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明'];

function getRandomName() {
    const familyName = FAMILY_NAMES[Math.floor(Math.random() * FAMILY_NAMES.length)];
    const givenName = GIVEN_NAMES[Math.floor(Math.random() * GIVEN_NAMES.length)];
    const givenName2 = Math.random() > 0.5 ? GIVEN_NAMES[Math.floor(Math.random() * GIVEN_NAMES.length)] : '';
    return familyName + givenName + givenName2;
}

function getRandomPhone() {
    const prefix = '1' + Math.floor(Math.random() * 7 + 3); // 13-19
    const suffix = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    return prefix + suffix;
}

async function submitUser(i) {
    const name = getRandomName();
    const phone = getRandomPhone();

    try {
        console.log(`[${i}] 正在提交: ${name} / ${phone}`);
        const response = await axios.post(BACKEND_URL, {
            name,
            phone
        });
        console.log(`[${i}] ✅ 成功: ${response.data.msg || 'OK'}`);
    } catch (error) {
        console.error(`[${i}] ❌ 失败:`, error.response ? error.response.data : error.message);
    }
}

async function run(count = 10, interval = 500) {
    console.log(`开始生成 ${count} 条测试数据...`);
    for (let i = 1; i <= count; i++) {
        await submitUser(i);
        if (i < count) {
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }
    console.log('测试数据生成完毕！');
}

// 获取命令行参数
const args = process.argv.slice(2);
const count = args[0] ? parseInt(args[0]) : 20; // 默认生成 20 个
const interval = args[1] ? parseInt(args[1]) : 800; // 默认间隔 800ms

run(count, interval);
