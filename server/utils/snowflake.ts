/**
 * Snowflake ID 生成器。
 * 生成唯一的 ID，每个 ID 包含时间戳、机器 ID 和序列号。
 * ID 总位数为 70 位，转换为十六进制字符串格式。
 * @author CaoMeiYouRen
 * @date 2025-06-21
 * @export
 * @class Snowflake
 */
export class Snowflake {
    private machineId: number
    private sequence: number = 0
    private lastTimestamp: number = -1

    constructor(machineId: number) {
        this.machineId = machineId
    }

    private currentTimestamp(): number {
        return Date.now()
    }

    private nextTimestamp(lastTimestamp: number): number {
        let timestamp = this.currentTimestamp()
        while (timestamp <= lastTimestamp) {
            timestamp = this.currentTimestamp()
        }
        return timestamp
    }

    /**
     * 生成一个唯一的 Snowflake ID。
     * ID 包含时间戳、机器 ID 和序列号。
     * ID 总位数为 70 位。
     * @returns {string} 生成的 Snowflake ID，十六进制字符串格式
     */
    generateId(): string {
        const timestamp = this.currentTimestamp()
        if (timestamp === this.lastTimestamp) {
            this.sequence = this.sequence + 1 & 0xfff // 12 位序列号
            if (this.sequence === 0) {
                // 序列号用尽，等待下一毫秒
                this.lastTimestamp = this.nextTimestamp(this.lastTimestamp)
            }
        } else {
            // 随机初始化 sequence 增加随机性
            this.sequence = Math.floor(Math.random() * 0xfff)
        }

        this.lastTimestamp = timestamp
        // 时间戳 48 位掩码，机器 ID 10 位，序列号 12 位，共 70 位
        // 生成的 ID 是一个 70 位二进制数，转换为十六进制
        // '0x1FFFFFFFFFF'
        const id = (BigInt(timestamp) & BigInt('0xFFFFFFFFFFFF')) << BigInt(22) |
            (BigInt(this.machineId) & BigInt(0x3FF)) << BigInt(12) |
            BigInt(this.sequence) & BigInt(0xFFF)
        return id.toString(16)
    }
}

// 机器 ID 默认为 1。可以从环境变量中获取机器 ID
export const snowflake = new Snowflake(Number(process.env.MACHINE_ID || 1))
