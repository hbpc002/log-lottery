import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import useStore from '@/store'

export function useViewModel() {
    const globalConfig = useStore().globalConfig
    const { getRegisterPage: registerPageData } = storeToRefs(globalConfig)

    const pageData = ref(JSON.parse(JSON.stringify(registerPageData.value)))

    watch(pageData, (val) => {
        globalConfig.setRegisterPage(val)
    }, { deep: true })

    function reset() {
        globalConfig.reset()
        pageData.value = JSON.parse(JSON.stringify(registerPageData.value))
    }

    return {
        pageData,
        reset,
    }
}
