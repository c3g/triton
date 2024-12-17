import { FileType } from "../../../triton-types/models/api"

export const FILE_TYPE_TO_REGEXP: Record<FileType, RegExp> = {
    FASTQ: /\.fastq\.gz$/,
    BAM: /(\.bam$)|(\.bai$)/,
    CRAM: /(\.cram$)|(\.crai$)/,
} as const
