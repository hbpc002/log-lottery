import type { Material, Object3D } from 'three'
import type { TargetType } from './type'
import type { IPersonConfig } from '@/types/storeType'
import * as TWEEN from '@tweenjs/tween.js'
import { storeToRefs } from 'pinia'
import { PerspectiveCamera, Scene, Vector3 } from 'three'
import { CSS3DObject, CSS3DRenderer } from 'three-css3d'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useToast } from 'vue-toast-notification'
import dongSound from '@/assets/audio/end.mp3'
import enterAudio from '@/assets/audio/enter.wav'
import worldCupAudio from '@/assets/audio/worldcup.mp3'
import { SINGLE_TIME_MAX_PERSON_COUNT } from '@/constant/config'
import { useElementPosition, useElementStyle } from '@/hooks/useElement'
import i18n from '@/locales/i18n'
import useStore from '@/store'
import { createDraftPerson, generateRandomAvatar, selectCard } from '@/utils'
import { rgba } from '@/utils/color'
import { LotteryStatus } from './type'
import { confettiFire, createSphereVertices, createTableVertices, getRandomElements, initTableData } from './utils'

const maxAudioLimit = 10
export function useViewModel() {
    const toast = useToast()
    // store里面存储的值
    const { personConfig, globalConfig, prizeConfig } = useStore()
    const {
        getAllPersonList: allPersonList,
        getNotPersonList: notPersonList,
        getNotThisPrizePersonList: notThisPrizePersonList,
    } = storeToRefs(personConfig)
    const { getCurrentPrize: currentPrize } = storeToRefs(prizeConfig)
    const {
        getCardColor: cardColor,
        getPatterColor: patternColor,
        getPatternList: patternList,
        getTextColor: textColor,
        getLuckyColor: luckyColor,
        getCardSize: cardSize,
        getTextSize: textSize,
        getRowCount: rowCount,
        getIsShowAvatar: isShowAvatar,
        getTitleFont: titleFont,
        getTitleFontSyncGlobal: titleFontSyncGlobal,
        getDefiniteTime: definiteTime,
        getWinMusic: isPlayWinMusic,
    } = storeToRefs(globalConfig)
    // three初始值
    const ballRotationY = ref(0)
    const containerRef = ref<HTMLElement>()
    const canOperate = ref(true)
    const cameraZ = ref(3000)
    const scene = ref()
    const camera = ref()
    const renderer = ref()
    const controls = ref()
    const objects = ref<any[]>([])
    const targets: TargetType = {
        grid: [],
        helix: [],
        table: [],
        sphere: [],
    }
    // 页面数据初始值
    const currentStatus = ref<LotteryStatus>(LotteryStatus.init) // 0为初始状态， 1为抽奖准备状态，2为抽奖中状态，3为抽奖结束状态
    const tableData = ref<any[]>([])
    const luckyTargets = ref<any[]>([])
    const luckyCardList = ref<number[]>([])
    const luckyCount = ref(10)
    const personPool = ref<IPersonConfig[]>([])
    const intervalTimer = ref<any>(null)
    const isInitialDone = ref<boolean>(false)
    const animationFrameId = ref<any>(null)
    const playingAudios = ref<HTMLAudioElement[]>([])

    // 抽奖音乐相关
    const lotteryMusic = ref<HTMLAudioElement | null>(null)
    const wsRef = ref<WebSocket | null>(null)

    function addNewCardToScene(person: any) {
        if (!scene.value)
            return

        // 平铺模式下，完全重新创建所有卡片以确保正确排列
        if (currentStatus.value === LotteryStatus.init) {
            // 停止所有进行中的动画
            TWEEN.removeAll()
            
            // 添加新人员到allPersonList（检查是否已存在）
            const exists = allPersonList.value.some(p => p.phone === person.phone)
            if (!exists) {
                const personWithId = { ...person, uid: person.uid || (allPersonList.value.length + 1).toString() }
                personConfig.addOnePerson([personWithId] as any)
            }
            
            // 完全移除所有现有对象
            objects.value.forEach(object => {
                scene.value.remove(object)
                if (object.element) {
                    object.element.remove()
                }
            })
            objects.value = []
            
            // 重新初始化tableData，包含新添加的人员
            tableData.value = initTableData({ allPersonList: allPersonList.value, rowCount: rowCount.value })
            
            // 重新创建所有卡片对象，按照正确的顺序
            const tableLen = tableData.value.length
            for (let i = 0; i < tableLen; i++) {
                let element = document.createElement('div')
                element.className = 'element-card'
                
                const number = document.createElement('div')
                number.className = 'card-id'
                number.textContent = tableData.value[i].uid
                // Always hide the ID element to show only name and phone
                number.style.display = 'none'
                element.appendChild(number)
                
                const symbol = document.createElement('div')
                symbol.className = 'card-name'
                symbol.textContent = tableData.value[i].name
                if (isShowAvatar.value)
                    symbol.className = 'card-name card-avatar-name'
                element.appendChild(symbol)
                
                const detail = document.createElement('div')
                detail.className = 'card-detail'
                // 展示姓名为主信息，部门/职位不再收集且不展示
                detail.innerHTML = `<div class="card-phone" style="font-size:0.6em;opacity:0.8;margin-top:2px">${tableData.value[i].phone || ''}</div>`
                if (isShowAvatar.value)
                    detail.style.display = 'none'
                element.appendChild(detail)
                
                if (isShowAvatar.value) {
                    const avatar = document.createElement('img')
                    avatar.className = 'card-avatar'
                    avatar.src = tableData.value[i].avatar || generateRandomAvatar(tableData.value[i].name)
                    avatar.alt = 'avatar'
                    avatar.style.width = '140px'
                    avatar.style.height = '140px'
                    element.appendChild(avatar)
                }
                else {
                    const avatarEmpty = document.createElement('div')
                    avatarEmpty.style.display = 'none'
                    element.appendChild(avatarEmpty)
                }
                
                element = useElementStyle({
                    element,
                    person: tableData.value[i],
                    index: i,
                    patternList: patternList.value,
                    patternColor: patternColor.value,
                    cardColor: cardColor.value,
                    cardSize: cardSize.value,
                    scale: 1,
                    textSize: textSize.value,
                    mod: 'default',
                })
                
                const object = new CSS3DObject(element)
                
                // 为旧卡片设置正常位置，为新卡片设置飞入位置
                const isNewCard = tableData.value[i].id === person.id || 
                                (tableData.value[i].name === person.name && tableData.value[i].phone === person.phone)
                
                if (isNewCard) {
                    // 新卡片从右侧飞入
                    object.position.x = 3000
                    object.position.y = (Math.random() - 0.5) * 1000
                    object.position.z = (Math.random() - 0.5) * 1000
                } else {
                    // 旧卡片保持在当前位置或设置为目标位置偏移
                    object.position.x = Math.random() * 1000 - 500
                    object.position.y = Math.random() * 1000 - 500
                    object.position.z = Math.random() * 1000 - 500
                }
                
                scene.value.add(object)
                objects.value.push(object)
            }
            
            // 重新创建平铺和球体的顶点
            targets.table = createTableVertices({ tableData: tableData.value, rowCount: rowCount.value, cardSize: cardSize.value })
            targets.sphere = createSphereVertices({ objectsLength: objects.value.length })
            
            // 执行平铺变换动画
            transform(targets.table, 1000, 'table').then(() => {
                // 恢复2026字样
                if (patternList.value.length) {
                    for (let i = 0; i < patternList.value.length; i++) {
                        if (i < rowCount.value * 7) {
                            const index = patternList.value[i] - 1
                            if (objects.value[index]) {
                                objects.value[index].element.style.background = `linear-gradient(135deg, ${rgba(patternColor.value, 0.9)} 0%, ${rgba(patternColor.value, 0.7)} 50%, ${rgba(patternColor.value, 0.8)} 100%)`
                            }
                        }
                    }
                }
            })
        } else {
            // 球体模式下的现有逻辑（保持不变）
            const index = tableData.value.length

            // 创建 DOM
            const element = document.createElement('div')
            element.className = 'element-card'

            const number = document.createElement('div')
            number.className = 'card-id'
            number.textContent = person.uid || (index + 1).toString()
            // Always hide the ID element to show only name and phone
            number.style.display = 'none'
            element.appendChild(number)

            const symbol = document.createElement('div')
            symbol.className = 'card-name'
            symbol.textContent = person.name
            if (isShowAvatar.value)
                symbol.className = 'card-name card-avatar-name'
            element.appendChild(symbol)

            const detail = document.createElement('div')
            detail.className = 'card-detail'
            if (isShowAvatar.value)
                detail.style.display = 'none'
            element.appendChild(detail)

            if (isShowAvatar.value) {
                const avatar = document.createElement('img')
                avatar.className = 'card-avatar'
                avatar.src = person.avatar || generateRandomAvatar(person.name)
                avatar.alt = 'avatar'
                avatar.style.width = '140px'
                avatar.style.height = '140px'
                element.appendChild(avatar)
            }
            else {
                const avatarEmpty = document.createElement('div')
                avatarEmpty.style.display = 'none'
                element.appendChild(avatarEmpty)
            }

            // Push to data
            const personWithId = { ...person, uid: person.uid || (index + 1).toString() }
            personConfig.addOnePerson([personWithId] as any)
            tableData.value.push(personWithId)

            // Apply Style
            useElementStyle({
                element,
                person: personWithId,
                index,
                patternList: patternList.value,
                patternColor: patternColor.value,
                cardColor: cardColor.value,
                cardSize: cardSize.value,
                scale: 1,
                textSize: textSize.value,
                mod: 'default',
            })

            const object = new CSS3DObject(element)

            scene.value.add(object)
            objects.value.push(object)

            // 更新 targets
            targets.table = createTableVertices({ tableData: tableData.value, rowCount: rowCount.value, cardSize: cardSize.value })
            targets.sphere = createSphereVertices({ objectsLength: objects.value.length })

            const newIndex = objects.value.length - 1

            const getTarget = (idx: number) => {
                return targets.sphere[idx]
            }

            // 为新添加的卡片设置初始位置（球体模式下随机交换）
            let swapIndex = Math.floor(Math.random() * (newIndex + 1))

            // 随机交换位置
            if (swapIndex !== newIndex) {
                const tempTarget = getTarget(swapIndex)
                if (tempTarget) {
                    targets.sphere[swapIndex] = getTarget(newIndex)
                    targets.sphere[newIndex] = tempTarget
                }

                const tempObject = objects.value[swapIndex]
                objects.value[swapIndex] = objects.value[newIndex]
                objects.value[newIndex] = tempObject

                const tempPerson = tableData.value[swapIndex]
                tableData.value[swapIndex] = tableData.value[newIndex]
                tableData.value[newIndex] = tempPerson
            }

            // 设置新卡片的初始位置
            const targetForNewCard = getTarget(swapIndex)
            if (targetForNewCard) {
                object.position.x = targetForNewCard.position.x + (Math.random() - 0.5) * 3000
                object.position.y = targetForNewCard.position.y + (Math.random() - 0.5) * 3000
                object.position.z = targetForNewCard.position.z + (Math.random() - 0.5) * 3000
            }
            else {
                object.position.x = Math.random() * 4000 - 2000
                object.position.y = Math.random() * 4000 - 2000
                object.position.z = Math.random() * 4000 - 2000
            }

            // 自定义三段式缓动函数：开始慢，中间快，结束慢
            const customEaseInOut = function (k: number) {
                if (k <= 0.2) {
                    // 前20%时间：慢速启动
                    return 2 * k * k * k;
                } else if (k <= 0.8) {
                    // 中间60%时间：快速移动
                    const adjustedK = (k - 0.2) / 0.6;
                    return 0.08 + 0.84 * adjustedK;
                } else {
                    // 后20%时间：慢速结束
                    const adjustedK = (k - 0.8) / 0.2;
                    return 0.92 + 0.08 * (1 - Math.pow(1 - adjustedK, 3));
                }
            };
            
            // 全员重新归位动画
            for (let i = 0; i < objects.value.length; i++) {
                const obj = objects.value[i]
                const target = getTarget(i)

                if (target) {
                    new TWEEN.Tween(obj.position)
                        .to({ x: target.position.x, y: target.position.y, z: target.position.z }, 2000)
                        .easing(customEaseInOut)
                        .start()

                    new TWEEN.Tween(obj.rotation)
                        .to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, 2000)
                        .easing(customEaseInOut)
                        .start()
                }
            }
        }
    }

    function initWebSocket() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
            const host = window.location.host
            const url = `${protocol}//${host}/api/ws`
            console.log('Connecting to WebSocket:', url)

            const ws = new WebSocket(url)
            wsRef.value = ws

            ws.onopen = () => {
                console.log('WebSocket connection established')
            }

            ws.onmessage = (event) => {
                console.log('Received WS message:', event.data)
                try {
                    const newMsg = JSON.parse(event.data)
                    if (newMsg && newMsg.type === 'new_person') {
                        // 1. 保存到 Store
                        const draft = createDraftPerson(newMsg.name, newMsg.phone)
                        // 检查是否已存在
                        const exists = allPersonList.value.some(p => p.phone === draft.phone)
                        if (!exists) {
                            personConfig.addOnePerson([draft] as any)
                            // 2. 更新 3D 场景
                            addNewCardToScene(draft)
                        }
                    }
                }
                catch (e) {
                    console.error('Failed to parse WS message', e)
                }
            }

            ws.onerror = (e) => {
                console.error('WebSocket error:', e)
            }

            ws.onclose = () => {
                console.log('WebSocket closed, retrying in 3s...')
                setTimeout(initWebSocket, 3000)
            }
        }
        catch (e) {
            console.error('WebSocket init error:', e)
        }
    }

    function initThreeJs() {
        const felidView = 40
        const width = window.innerWidth
        const height = window.innerHeight
        const aspect = width / height
        const nearPlane = 1
        const farPlane = 10000
        const WebGLoutput = containerRef.value

        scene.value = new Scene()
        camera.value = new PerspectiveCamera(felidView, aspect, nearPlane, farPlane)
        camera.value.position.z = cameraZ.value
        renderer.value = new CSS3DRenderer()
        renderer.value.setSize(width, height * 0.9)
        renderer.value.domElement.style.position = 'absolute'
        // 垂直居中
        renderer.value.domElement.style.paddingTop = '50px'
        renderer.value.domElement.style.top = '50%'
        renderer.value.domElement.style.left = '50%'
        renderer.value.domElement.style.transform = 'translate(-50%, -50%)'
        WebGLoutput!.appendChild(renderer.value.domElement)

        controls.value = new TrackballControls(camera.value, renderer.value.domElement)
        controls.value.rotateSpeed = 1
        controls.value.staticMoving = true
        controls.value.minDistance = 500
        controls.value.maxDistance = 6000
        controls.value.addEventListener('change', render)

        const tableLen = tableData.value.length
        for (let i = 0; i < tableLen; i++) {
            let element = document.createElement('div')
            element.className = 'element-card'

            const number = document.createElement('div')
            number.className = 'card-id'
            number.textContent = tableData.value[i].uid
            // Always hide the ID element to show only name and phone
            number.style.display = 'none'
            element.appendChild(number)

            const symbol = document.createElement('div')
            symbol.className = 'card-name'
            symbol.textContent = tableData.value[i].name
            if (isShowAvatar.value)
                symbol.className = 'card-name card-avatar-name'
            element.appendChild(symbol)

            const detail = document.createElement('div')
            detail.className = 'card-detail'
            // 展示姓名为主信息，部门/职位不再收集且不展示
            detail.innerHTML = `<div class="card-phone" style="font-size:0.6em;opacity:0.8;margin-top:2px">${tableData.value[i].phone || ''}</div>`
            if (isShowAvatar.value)
                detail.style.display = 'none'
            element.appendChild(detail)

            if (isShowAvatar.value) {
                const avatar = document.createElement('img')
                avatar.className = 'card-avatar'
                avatar.src = tableData.value[i].avatar || generateRandomAvatar(tableData.value[i].name)
                avatar.alt = 'avatar'
                avatar.style.width = '140px'
                avatar.style.height = '140px'
                element.appendChild(avatar)
            }
            else {
                const avatarEmpty = document.createElement('div')
                avatarEmpty.style.display = 'none'
                element.appendChild(avatarEmpty)
            }

            element = useElementStyle({
                element,
                person: tableData.value[i],
                index: i,
                patternList: patternList.value,
                patternColor: patternColor.value,
                cardColor: cardColor.value,
                cardSize: cardSize.value,
                scale: 1,
                textSize: textSize.value,
                mod: 'default',
            },
            )
            const object = new CSS3DObject(element)
            object.position.x = Math.random() * 4000 - 2000
            object.position.y = Math.random() * 4000 - 2000
            object.position.z = Math.random() * 4000 - 2000
            scene.value.add(object)

            objects.value.push(object)
        }
        // 创建横铺的界面
        const tableVertices = createTableVertices({ tableData: tableData.value, rowCount: rowCount.value, cardSize: cardSize.value })
        targets.table = tableVertices
        // 创建球体
        const sphereVertices = createSphereVertices({ objectsLength: objects.value.length })
        targets.sphere = sphereVertices
        window.addEventListener('resize', onWindowResize, false)
transform(targets.table, 1000, 'table')
        render()
    }
    function render() {
        if (renderer.value) {
            renderer.value.render(scene.value, camera.value)
        }
    }
    /**
     * @description: 位置变换
     * @param targets 目标位置
     * @param duration 持续时间
     */
    function transform(targets: any[], duration: number, targetMode: 'table' | 'sphere' = 'sphere') {
        TWEEN.removeAll()
        if (intervalTimer.value) {
            clearInterval(intervalTimer.value)
            intervalTimer.value = null
            randomBallData('sphere')
        }

        return new Promise((resolve) => {
            const objLength = objects.value.length
            for (let i = 0; i < objLength; ++i) {
                const object = objects.value[i]
                const target = targets[i]
                new TWEEN.Tween(object.position)
                    .to({ x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration)
                    .easing(TWEEN.Easing.Exponential.InOut)
                    .start()

                // 如果是平铺布局，确保旋转为0；如果是球体布局，使用目标旋转
                const rotationTween = targetMode === 'table' 
                    ? { x: 0, y: 0, z: 0 }
                    : { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }
                    
                new TWEEN.Tween(object.rotation)
                    .to(rotationTween, Math.random() * duration + duration)
                    .easing(TWEEN.Easing.Exponential.InOut)
                    .start()
                    .onComplete(() => {
                        if (luckyCardList.value.length && targetMode === 'sphere') {
                            luckyCardList.value.forEach((cardIndex: any) => {
                                const item = objects.value[cardIndex]
                                useElementStyle({
                                    element: item.element,
                                    person: {} as any,
                                    index: i,
                                    patternList: patternList.value,
                                    patternColor: patternColor.value,
                                    cardColor: cardColor.value,
                                    cardSize: cardSize.value,
                                    scale: 1,
                                    textSize: textSize.value,
                                    mod: 'sphere',
                                })
                            })
                        }
                        luckyTargets.value = []
                        luckyCardList.value = []
                        canOperate.value = true
                    })
                    .onComplete(() => {
                        if (luckyCardList.value.length) {
                            luckyCardList.value.forEach((cardIndex: any) => {
                                const item = objects.value[cardIndex]
                                useElementStyle({
                                    element: item.element,
                                    person: {} as any,
                                    index: i,
                                    patternList: patternList.value,
                                    patternColor: patternColor.value,
                                    cardColor: cardColor.value,
                                    cardSize: cardSize.value,
                                    scale: 1,
                                    textSize: textSize.value,
                                    mod: 'sphere',
                                })
                            })
                        }
                        luckyTargets.value = []
                        luckyCardList.value = []
                        canOperate.value = true
                    })
            }

            // 这个补间用来在位置与旋转补间同步执行，通过onUpdate在每次更新数据后渲染scene和camera
            new TWEEN.Tween({})
                .to({}, duration * 2)
                .onUpdate(render)
                .start()
                .onComplete(() => {
                    canOperate.value = true
                    resolve('')
                })
        })
    }
    /**
     * @description: 窗口大小改变时重新设置渲染器的大小
     */
    function onWindowResize() {
        camera.value.aspect = window.innerWidth / window.innerHeight
        camera.value.updateProjectionMatrix()

        renderer.value.setSize(window.innerWidth, window.innerHeight)
        render()
    }

    /**
     * [animation update all tween && controls]
     */
    function animation() {
        TWEEN.update()
        if (controls.value) {
            controls.value.update()
        }
        // 设置自动旋转
        // 设置相机位置
        animationFrameId.value = requestAnimationFrame(animation)
    }
    /**
     * @description: 旋转的动画
     * @param rotateY 绕y轴旋转圈数
     * @param duration 持续时间，单位秒
     */
    function rollBall(rotateY: number, duration: number) {
        TWEEN.removeAll()

        return new Promise((resolve) => {
            scene.value.rotation.y = 0
            ballRotationY.value = Math.PI * rotateY * 1000
            const rotateObj = new TWEEN.Tween(scene.value.rotation)
            rotateObj
                .to(
                    {
                        // x: Math.PI * rotateX * 1000,
                        x: 0,
                        y: ballRotationY.value,
                        // z: Math.PI * rotateZ * 1000
                        z: 0,
                    },
                    duration * 1000,
                )
                .onUpdate(render)
                .start()
                .onStop(() => {
                    resolve('')
                })
                .onComplete(() => {
                    resolve('')
                })
        })
    }
    /**
     * @description: 视野转回正面
     */
    function resetCamera() {
        new TWEEN.Tween(camera.value.position)
            .to(
                {
                    x: 0,
                    y: 0,
                    z: 3000,
                },
                1000,
            )
            .onUpdate(render)
            .start()
            .onComplete(() => {
                new TWEEN.Tween(camera.value.rotation)
                    .to(
                        {
                            x: 0,
                            y: 0,
                            z: 0,
                        },
                        1000,
                    )
                    .onUpdate(render)
                    .start()
                    .onComplete(() => {
                        canOperate.value = true
                        // camera.value.lookAt(scene.value.position)
                        camera.value.position.y = 0
                        camera.value.position.x = 0
                        camera.value.position.z = 3000
                        camera.value.rotation.x = 0
                        camera.value.rotation.y = 0
                        camera.value.rotation.z = -0
                        controls.value.reset()
                    })
            })
    }

    /**
     * @description: 开始抽奖音乐
     */
    function startLotteryMusic() {
        if (!isPlayWinMusic.value) {
            return
        }
        if (lotteryMusic.value) {
            lotteryMusic.value.pause()
            lotteryMusic.value = null
        }

        lotteryMusic.value = new Audio(worldCupAudio)
        lotteryMusic.value.loop = true
        lotteryMusic.value.volume = 0.7

        lotteryMusic.value.play().catch((error) => {
            console.error('播放抽奖音乐失败:', error)
        })
    }

    /**
     * @description: 停止抽奖音乐
     */
    function stopLotteryMusic() {
        if (!isPlayWinMusic.value) {
            return
        }
        if (lotteryMusic.value) {
            lotteryMusic.value.pause()
            lotteryMusic.value = null
        }
    }

    /**
     * @description: 播放结束音效
     */
    function playEndSound() {
        if (!isPlayWinMusic.value) {
            return
        }
        console.log('准备播放结束音效', dongSound)

        // 清理已结束的音频
        playingAudios.value = playingAudios.value.filter(audio => !audio.ended)

        try {
            const endSound = new Audio(dongSound)
            endSound.volume = 1.0

            // 简化播放逻辑
            const playPromise = endSound.play()

            if (playPromise) {
                playPromise
                    .then(() => {
                        console.log('结束音效播放成功')
                        playingAudios.value.push(endSound)
                    })
                    .catch((err) => {
                        console.error('播放失败:', err.name, err.message)
                        if (err.name === 'NotAllowedError') {
                            console.warn('自动播放被阻止，需用户交互后播放')
                        }
                    })
            }

            endSound.onended = () => {
                console.log('结束音效播放完成')
                const index = playingAudios.value.indexOf(endSound)
                if (index > -1)
                    playingAudios.value.splice(index, 1)
            }
        }
        catch (error) {
            console.error('创建音频对象失败:', error)
        }
    }

    /**
     * @description: 重置音频状态
     */
    function resetAudioState() {
        if (!isPlayWinMusic.value) {
            return
        }
        // 停止抽奖音乐
        stopLotteryMusic()

        // 清理所有正在播放的音频
        playingAudios.value.forEach((audio) => {
            if (!audio.ended && !audio.paused) {
                audio.pause()
            }
        })
        playingAudios.value = []
    }

    /**
     * @description: 开始抽奖，由横铺变换为球体（或其他图形）
     * @returns 随机抽取球数据
     */
    /// <IP_ADDRESS>description 进入抽奖准备状态
    async function enterLottery() {
        if (!canOperate.value) {
            return
        }

        // 重置音频状态
        resetAudioState()

        // 预加载音频资源以解决浏览器自动播放策略
        try {
            const audioContext = window.AudioContext || (window as any).webkitAudioContext
            if (audioContext) {
                console.log('音频上下文可用')
            }
        }
        catch (e) {
            console.warn('音频上下文不可用:', e)
        }

        if (!intervalTimer.value) {
            randomBallData()
        }
        if (patternList.value.length) {
            for (let i = 0; i < patternList.value.length; i++) {
                if (i < rowCount.value * 7) {
                    // 统一红包样式，不再使用随机颜色
                    objects.value[patternList.value[i] - 1].element.style.background = 'linear-gradient(135deg, #ff4b4b 0%, #e63946 50%, #d62828 100%)'
                }
            }
        }
        canOperate.value = false
        await transform(targets.sphere, 1000, 'sphere')
        currentStatus.value = LotteryStatus.ready
        window.lotteryStatus = LotteryStatus.ready
        rollBall(0.1, 2000)
    }
    /**
     * @description 开始抽奖
     */
    function startLottery() {
        if (!canOperate.value) {
            return
        }
        // 验证是否已抽完全部奖项
        if (currentPrize.value.isUsed || !currentPrize.value) {
            toast.open({
                message: i18n.global.t('error.personIsAllDone'),
                type: 'warning',
                position: 'top-right',
                duration: 10000,
            })

            return
        }
        // personPool.value = currentPrize.value.isAll ? notThisPrizePersonList.value : notPersonList.value
        personPool.value = currentPrize.value.isAll ? [...notThisPrizePersonList.value] : [...notPersonList.value]
        // 验证抽奖人数是否还够
        if (personPool.value.length < currentPrize.value.count - currentPrize.value.isUsedCount) {
            toast.open({
                message: i18n.global.t('error.personNotEnough'),
                type: 'warning',
                position: 'top-right',
                duration: 10000,
            })

            return
        }
        // 默认置为单次抽奖最大个数
        luckyCount.value = SINGLE_TIME_MAX_PERSON_COUNT
        // 还剩多少人未抽
        let leftover = currentPrize.value.count - currentPrize.value.isUsedCount
        const customCount = currentPrize.value.separateCount
        if (customCount && customCount.enable && customCount.countList.length > 0) {
            for (let i = 0; i < customCount.countList.length; i++) {
                if (customCount.countList[i].isUsedCount < customCount.countList[i].count) {
                    // 根据自定义人数来抽取
                    leftover = customCount.countList[i].count - customCount.countList[i].isUsedCount
                    break
                }
            }
        }
        luckyCount.value = leftover < luckyCount.value ? leftover : luckyCount.value
        // 重构抽奖函数
        luckyTargets.value = getRandomElements(personPool.value, luckyCount.value)
        luckyTargets.value.forEach((item) => {
            const index = personPool.value.findIndex(person => person.id === item.id)
            if (index > -1) {
                personPool.value.splice(index, 1)
            }
        })

        toast.open({
            // message: `现在抽取${currentPrize.value.name} ${leftover}人`,
            message: i18n.global.t('error.startDraw', { count: currentPrize.value.name, leftover }),
            type: 'default',
            position: 'top-right',
            duration: 8000,
        })

        // 开始播放抽奖音乐
        startLotteryMusic()

        currentStatus.value = LotteryStatus.running
        window.lotteryStatus = LotteryStatus.running
        rollBall(10, 3000)
        if (definiteTime.value) {
            setTimeout(() => {
                if (currentStatus.value === LotteryStatus.running) {
                    stopLottery()
                }
            }, definiteTime.value * 1000)
        }
    }
    /**
     * @description: 停止抽奖，抽出幸运人
     */
    async function stopLottery() {
        if (!canOperate.value) {
            return
        }
        // 停止抽奖音乐
        stopLotteryMusic()

        // 播放结束音效
        playEndSound()

        //   clearInterval(intervalTimer.value)
        //   intervalTimer.value = null
        canOperate.value = false
        rollBall(0, 1)

        const windowSize = { width: window.innerWidth, height: window.innerHeight }
        luckyTargets.value.forEach((person: IPersonConfig, index: number) => {
            const cardIndex = selectCard(luckyCardList.value, tableData.value.length, person.id)
            luckyCardList.value.push(cardIndex)
            const totalLuckyCount = luckyTargets.value.length
            const item = objects.value[cardIndex]
            const { xTable, yTable, scale } = useElementPosition(
                item,
                rowCount.value,
                totalLuckyCount,
                { width: cardSize.value.width, height: cardSize.value.height },
                windowSize,
                index,
            )
            new TWEEN.Tween(item.position)
                .to({
                    x: xTable,
                    y: yTable,
                    z: 1000,
                }, 1200)
                .easing(TWEEN.Easing.Exponential.InOut)
                .onStart(() => {
                    item.element = useElementStyle({
                        element: item.element,
                        person,
                        index: cardIndex,
                        patternList: patternList.value,
                        patternColor: patternColor.value,
                        cardColor: luckyColor.value,
                        cardSize: { width: cardSize.value.width, height: cardSize.value.height },
                        scale,
                        textSize: textSize.value,
                        mod: 'lucky',
                    })
                })
                .start()
                .onComplete(() => {
                    canOperate.value = true
                    currentStatus.value = LotteryStatus.end
                    window.lotteryStatus = LotteryStatus.end
                })
            new TWEEN.Tween(item.rotation)
                .to({
                    x: 0,
                    y: 0,
                    z: 0,
                }, 900)
                .easing(TWEEN.Easing.Exponential.InOut)
                .start()
                .onComplete(() => {
                    playWinMusic()

                    confettiFire()
                    resetCamera()
                })
        })
    }
    // 播放音频，中将卡片越多audio对象越多，声音越大
    function playWinMusic() {
        if (!isPlayWinMusic.value) {
            return
        }
        // 清理已结束的音频
        playingAudios.value = playingAudios.value.filter(audio => !audio.ended && !audio.paused)

        if (playingAudios.value.length > maxAudioLimit) {
            console.log('音频播放数量已达到上限，请勿重复播放')
            return
        }

        const enterNewAudio = new Audio(enterAudio)
        enterNewAudio.volume = 0.8

        playingAudios.value.push(enterNewAudio)
        enterNewAudio.play()
            .then(() => {
                // 当音频播放结束后，从数组中移除
                enterNewAudio.onended = () => {
                    const index = playingAudios.value.indexOf(enterNewAudio)
                    if (index > -1) {
                        playingAudios.value.splice(index, 1)
                    }
                }
            })
            .catch((error) => {
                console.error('播放音频失败:', error)
                // 如果播放失败，也从数组中移除
                const index = playingAudios.value.indexOf(enterNewAudio)
                if (index > -1) {
                    playingAudios.value.splice(index, 1)
                }
            })

        // 播放错误时从数组中移除
        enterNewAudio.onerror = () => {
            const index = playingAudios.value.indexOf(enterNewAudio)
            if (index > -1) {
                playingAudios.value.splice(index, 1)
            }
        }
    }
    /**
     * @description: 继续,意味着这抽奖作数，计入数据库
     */
    async function continueLottery() {
        if (!canOperate.value) {
            return
        }
        const customCount = currentPrize.value.separateCount
        if (customCount && customCount.enable && customCount.countList.length > 0) {
            for (let i = 0; i < customCount.countList.length; i++) {
                if (customCount.countList[i].isUsedCount < customCount.countList[i].count) {
                    customCount.countList[i].isUsedCount += luckyCount.value
                    break
                }
            }
        }
        currentPrize.value.isUsedCount += luckyCount.value
        luckyCount.value = 0
        if (currentPrize.value.isUsedCount >= currentPrize.value.count) {
            currentPrize.value.isUsed = true
            currentPrize.value.isUsedCount = currentPrize.value.count
        }
        personConfig.addAlreadyPersonList(luckyTargets.value, currentPrize.value)
        prizeConfig.updatePrizeConfig(currentPrize.value)
        await enterLottery()
    }
    /**
     * @description: 放弃本次抽奖，回到初始状态
     */
    function quitLottery() {
        // 停止抽奖音乐
        stopLotteryMusic()

        enterLottery()
        currentStatus.value = LotteryStatus.init
        window.lotteryStatus = LotteryStatus.init
    }

    /**
     * @description: 随机替换卡片中的数据（不改变原有的值，只是显示）
     * @param {string} mod 模式
     */
    function randomBallData(mod: 'default' | 'lucky' | 'sphere' = 'default') {
        // 两秒执行一次
        intervalTimer.value = setInterval(() => {
            // 产生随机数数组
            const indexLength = 4
            const cardRandomIndexArr: number[] = []
            const personRandomIndexArr: number[] = []
            for (let i = 0; i < indexLength; i++) {
                // 解决随机元素概率过于不均等问题
                const randomCardIndex = Math.floor(Math.random() * (tableData.value.length - 1))
                const randomPersonIndex = Math.floor(Math.random() * (allPersonList.value.length - 1))
                if (luckyCardList.value.includes(randomCardIndex)) {
                    continue
                }
                cardRandomIndexArr.push(randomCardIndex)
                personRandomIndexArr.push(randomPersonIndex)
            }
            for (let i = 0; i < cardRandomIndexArr.length; i++) {
                if (!objects.value[cardRandomIndexArr[i]]) {
                    continue
                }
                objects.value[cardRandomIndexArr[i]].element = useElementStyle({
                    element: objects.value[cardRandomIndexArr[i]].element,
                    person: allPersonList.value[personRandomIndexArr[i]],
                    index: cardRandomIndexArr[i],
                    patternList: patternList.value,
                    patternColor: patternColor.value,
                    cardColor: cardColor.value,
                    cardSize: { width: cardSize.value.width, height: cardSize.value.height },
                    textSize: textSize.value,
                    scale: 1,
                    mod,
                    type: 'change',
                })
            }
        }, 200)
    }
    /**
     * @description: 键盘监听，快捷键操作
     */
    function listenKeyboard(e: any) {
        if ((e.keyCode !== 32 || e.keyCode !== 27) && !canOperate.value) {
            return
        }
        if (e.keyCode === 27 && currentStatus.value === LotteryStatus.running) {
            quitLottery()
        }
        if (e.keyCode !== 32) {
            return
        }
        switch (currentStatus.value) {
            case LotteryStatus.init:
                enterLottery()
                break
            case LotteryStatus.ready:
                startLottery()
                break
            case LotteryStatus.running:
                stopLottery()
                break
            case LotteryStatus.end:
                continueLottery()
                break
            default:
                break
        }
    }
    /**
     * @description: 清理资源，避免内存溢出
     */
    function cleanup() {
        // 停止所有Tween动画
        TWEEN.removeAll()

        // 清理动画循环
        if ((window as any).cancelAnimationFrame) {
            (window as any).cancelAnimationFrame(animationFrameId.value)
        }
        clearInterval(intervalTimer.value)
        intervalTimer.value = null

        // 停止抽奖音乐
        stopLotteryMusic()

        // 清理所有音频资源
        playingAudios.value.forEach((audio) => {
            if (!audio.ended && !audio.paused) {
                audio.pause()
            }
            // 释放音频资源
            audio.src = ''
            audio.load()
        })
        playingAudios.value = []

        if (scene.value) {
            scene.value.traverse((object: Object3D) => {
                if ((object as any).material) {
                    if (Array.isArray((object as any).material)) {
                        (object as any).material.forEach((material: Material) => {
                            material.dispose()
                        })
                    }
                    else {
                        (object as any).material.dispose()
                    }
                }
                if ((object as any).geometry) {
                    (object as any).geometry.dispose()
                }
                if ((object as any).texture) {
                    (object as any).texture.dispose()
                }
            })
            scene.value.clear()
        }

        if (objects.value) {
            objects.value.forEach((object) => {
                if (object.element) {
                    object.element.remove()
                }
            })
            objects.value = []
        }

        if (controls.value) {
            controls.value.removeEventListener('change')
            controls.value.dispose()
        }
        //   移除所有事件监听
        window.removeEventListener('resize', onWindowResize)
        scene.value = null
        camera.value = null
        renderer.value = null
        controls.value = null
    }
    /**
     * @description: 设置默认人员列表
     */
    function setDefaultPersonList() {
        personConfig.setDefaultPersonList()
        // 刷新页面
        window.location.reload()
    }
    const init = () => {
        const startTime = Date.now()
        const maxWaitTime = 2000 // 2秒

        const checkAndInit = () => {
            // 如果人员列表有数据或者等待时间超过2秒，则执行初始化
            if (allPersonList.value.length > 0 || (Date.now() - startTime) >= maxWaitTime) {
                console.log('初始化完成')
                tableData.value = initTableData({ allPersonList: allPersonList.value, rowCount: rowCount.value })
                initThreeJs()
                animation()
                containerRef.value!.style.color = `${textColor}`
                randomBallData()
                window.addEventListener('keydown', listenKeyboard)
                isInitialDone.value = true

                initWebSocket()
            }
            else {
                console.log('等待人员列表数据...')
                // 继续等待
                setTimeout(checkAndInit, 100) // 每100毫秒检查一次
            }
        }

        checkAndInit()
    }
onMounted(() => {
    init()
    // 将返回平铺函数注册到全局window对象
    console.log('Registering backToTableFunction on window')
    ;(window).backToTableFunction = backToTable
    console.log('backToTableFunction registered:', typeof (window).backToTableFunction)
    
    // 监听backToTable事件
    ;(window).backToTableEventHandle = () => {
        backToTable()
    }
    window.addEventListener('backToTable', window.backToTableEventHandle)
    
    // 初始化状态
    window.lotteryStatus = currentStatus.value
})

// 监听状态变化
watch(currentStatus, (newStatus: LotteryStatus) => {
    ;(window).lotteryStatus = newStatus
    console.log('LotteryStatus changed to:', newStatus)
    // 触发自定义事件，通知RightButton更新
    window.dispatchEvent(new CustomEvent('lotteryStatusChanged', { detail: { status: newStatus } }))
})
onUnmounted(() => {
    nextTick(() => {
        cleanup()
    })
    if (wsRef.value) {
        wsRef.value.close()
    }
    clearInterval(intervalTimer.value)
    intervalTimer.value = null
    window.removeEventListener('keydown', listenKeyboard)
    // 清理全局函数和事件监听
    delete (window).backToTableFunction
    if (window.backToTableEventHandle) {
        window.removeEventListener('backToTable', window.backToTableEventHandle)
        delete window.backToTableEventHandle
    }
})

    /**
     * @description: 从球体状态切换回平铺状态
     */
    async function backToTable() {
        if (!canOperate.value) {
            return
        }
        // 停止抽奖音乐
        stopLotteryMusic()
        
        // 清理定时器
        if (intervalTimer.value) {
            clearInterval(intervalTimer.value)
            intervalTimer.value = null
        }
        
        canOperate.value = false
        
        // 重置场景旋转
        new TWEEN.Tween(scene.value.rotation)
            .to({
                x: 0,
                y: 0,
                z: 0,
            }, 800)
            .easing(TWEEN.Easing.Exponential.InOut)
            .onUpdate(render)
            .start()
        
        // 重新初始化tableData，保持原始数据顺序
        tableData.value = initTableData({ allPersonList: allPersonList.value, rowCount: rowCount.value })
        
        // 重置卡片内容为原始数据
        const tableLen = tableData.value.length
        for (let i = 0; i < tableLen && i < objects.value.length; i++) {
            const object = objects.value[i]
            
            // 更新卡片内容为原始数据
            const numberElement = object.element.querySelector('.card-id')
            const nameElement = object.element.querySelector('.card-name')
            const detailElement = object.element.querySelector('.card-detail')
            const avatarElement = object.element.querySelector('.card-avatar')
            
            if (numberElement) {
                numberElement.textContent = tableData.value[i].uid
                numberElement.style.display = 'none'
            }
            
            if (nameElement) {
                nameElement.textContent = tableData.value[i].name
                if (isShowAvatar.value) {
                    nameElement.className = 'card-name card-avatar-name'
                } else {
                    nameElement.className = 'card-name'
                }
            }
            
            if (detailElement) {
                detailElement.innerHTML = `<div class="card-phone" style="font-size:0.6em;opacity:0.8;margin-top:2px">${tableData.value[i].phone || ''}</div>`
                if (isShowAvatar.value) {
                    detailElement.style.display = 'none'
                } else {
                    detailElement.style.display = 'block'
                }
            }
            
            if (isShowAvatar.value && avatarElement) {
                avatarElement.src = tableData.value[i].avatar || generateRandomAvatar(tableData.value[i].name)
                avatarElement.style.display = 'block'
            } else if (avatarElement) {
                avatarElement.style.display = 'none'
            }
            
            // 更新样式
            useElementStyle({
                element: object.element,
                person: tableData.value[i],
                index: i,
                patternList: [],
                patternColor: patternColor.value,
                cardColor: cardColor.value,
                cardSize: cardSize.value,
                scale: 1,
                textSize: textSize.value,
                mod: 'default',
            })
        }
        
        // 重新创建横铺和球体的顶点
        targets.table = createTableVertices({ tableData: tableData.value, rowCount: rowCount.value, cardSize: cardSize.value })
        targets.sphere = createSphereVertices({ objectsLength: objects.value.length })
        
        render()
        
        // 爆炸效果动画：先向外扩散，再汇聚回平铺位置
        return new Promise((resolve) => {
            // 自定义三段式缓动函数：开始慢，中间快，结束慢
            const customEaseInOut = function (k: number) {
                if (k <= 0.2) {
                    // 前20%时间：慢速启动
                    return 2 * k * k * k;
                } else if (k <= 0.8) {
                    // 中间60%时间：快速移动
                    const adjustedK = (k - 0.2) / 0.6;
                    return 0.08 + 0.84 * adjustedK;
                } else {
                    // 后20%时间：慢速结束
                    const adjustedK = (k - 0.8) / 0.2;
                    return 0.92 + 0.08 * (1 - Math.pow(1 - adjustedK, 3));
                }
            };
            
            // 第一阶段：爆炸效果 - 从当前位置向外扩散
            TWEEN.removeAll()
            
            const objLength = objects.value.length
            const explosionDuration = 500 // 爆炸阶段持续时间
            const convergeDuration = 1000 // 汇聚阶段持续时间，减少以提升性能
            const totalDuration = explosionDuration + convergeDuration
            
            // 创建一个主时间轴来协调所有动画
            const masterTimeline = new TWEEN.Tween({})
                .to({}, totalDuration)
                .onUpdate(() => {
                    // 只在动画进行时渲染，减少不必要的渲染
                    if (TWEEN.getAll().length > 0) {
                        render()
                    }
                })
.onComplete(() => {
                    currentStatus.value = LotteryStatus.init
                    window.lotteryStatus = LotteryStatus.init
                    
                    // 恢复2026字样
                    if (patternList.value.length) {
                        for (let i = 0; i < patternList.value.length; i++) {
                            if (i < rowCount.value * 7) {
                                const index = patternList.value[i] - 1
                                if (objects.value[index]) {
                                    objects.value[index].element.style.background = `linear-gradient(135deg, ${rgba(patternColor.value, 0.9)} 0%, ${rgba(patternColor.value, 0.7)} 50%, ${rgba(patternColor.value, 0.8)} 100%)`
                                }
                            }
                        }
                    }
                    
                    // 重新启动动画循环，使卡片保持动态效果
                    if (!animationFrameId.value) {
                        animation()
                    }
                    
                    // 重新启动随机数据变化
                    if (!intervalTimer.value) {
                        randomBallData()
                    }
                    
                    // 重置相机视角
                    resetCamera()
                    canOperate.value = true
                    resolve('')
                })
                .start()
            
            // 预先计算所有位置和旋转值，减少循环中的计算
            const explosionTargets = []
            const targetRotations = []
            
            for (let i = 0; i < objLength; ++i) {
                const object = objects.value[i]
                const currentPos = {
                    x: object.position.x,
                    y: object.position.y,
                    z: object.position.z
                }
                
                // 计算爆炸方向（从中心向外）
                const len = Math.sqrt(currentPos.x * currentPos.x + currentPos.y * currentPos.y + currentPos.z * currentPos.z)
                const explosionDirection = {
                    x: currentPos.x / len,
                    y: currentPos.y / len,
                    z: currentPos.z / len
                }
                
                // 爆炸目标位置
                explosionTargets.push({
                    x: currentPos.x + explosionDirection.x * 1800,
                    y: currentPos.y + explosionDirection.y * 1800,
                    z: currentPos.z + explosionDirection.z * 1400
                })
                
                // 随机目标旋转值
                targetRotations.push({
                    x: Math.random() * Math.PI * 2,
                    y: Math.random() * Math.PI * 2,
                    z: Math.random() * Math.PI * 2
                })
            }
            
            // 减少setTimeout的使用，改用延迟启动数组
            const delayGroups: (() => void)[][] = [[], [], [], [], []] // 分成5组，每组间隔40ms
            
            for (let i = 0; i < objLength; ++i) {
                const object = objects.value[i]
                const explosionTarget = explosionTargets[i]
                const targetRotation = targetRotations[i]
                const tableTarget = targets.table[i].position
                
                // 第一阶段：爆炸动画 - 使用自定义的三段式缓动
                const explosionTween = new TWEEN.Tween(object.position)
                    .to(explosionTarget, explosionDuration)
                    .easing(customEaseInOut) // 自定义慢-快-慢效果
                
                // 旋转动画 - 使用自定义三段式缓动
                const rotationTween = new TWEEN.Tween(object.rotation)
                    .to(targetRotation, explosionDuration)
                    .easing(customEaseInOut) // 旋转同样使用慢-快-慢
                
                // 第二阶段：汇聚回平铺位置 - 使用自定义的三段式缓动
                const convergeTween = new TWEEN.Tween(object.position)
                    .to(tableTarget, convergeDuration)
                    .easing(customEaseInOut) // 汇聚过程也使用慢-快-慢
                
                // 最终旋转归零 - 使用自定义三段式缓动
                const convergeRotationTween = new TWEEN.Tween(object.rotation)
                    .to({ x: 0, y: 0, z: 0 }, convergeDuration)
                    .easing(customEaseInOut) // 旋转归零同样平滑
                
                // 连接动画序列
                explosionTween.chain(convergeTween)
                rotationTween.chain(convergeRotationTween)
                
                // 使用分组延迟代替随机延迟，减少setTimeout数量
                const groupIndex = Math.floor(Math.random() * delayGroups.length)
                delayGroups[groupIndex].push(() => {
                    explosionTween.start()
                    rotationTween.start()
                })
            }
            
            // 使用少量的setTimeout来启动分组
            delayGroups.forEach((group, index) => {
                setTimeout(() => {
                    group.forEach(startFn => startFn())
                }, index * 40) // 每组间隔40ms
            })
        })
    }

    return {
        setDefaultPersonList,
        startLottery,
        continueLottery,
        quitLottery,
        containerRef,
        stopLottery,
        enterLottery,
        tableData,
        currentStatus,
        isInitialDone,
        titleFont,
        titleFontSyncGlobal,
        backToTable,
    }
}
