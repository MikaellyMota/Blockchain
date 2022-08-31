import { hash, hashValidado } from './helpers'

export interface Bloco {
  header: {
    nonce: number
    hashBloco: string
  }
  payload: {
    sequence: number 
    timestamp: number
    data: any
    previousHash: string
  }
}

export class BlockChain {
  #chain: Bloco[] = []
  private prefixoPow = "0"

  constructor (private readonly dificuldade: number = 3) {
    this.#chain.push(this.criarBlocoGenesis())
  }

  private criarBlocoGenesis () {
    const payload = {
      sequence: 0,
      timestamp: +new Date(),
      data: 'Bloco Genesis',
      previousHash: ''
    }
    return {
      header: {
        nonce: 0,
        hashBloco: hash(JSON.stringify(payload))
      },
      payload
    }
  }

  private get ultimoBloco (): Bloco {
    return this.#chain.at(-1) as Bloco
  }

  get chain () {
    return this.#chain
  }

  private getHashUltimoBloco() {
    return this.ultimoBloco.header.hashBloco
  }

  criarBloco (data: any): Bloco['payload'] {
    const novoBloco = {
      sequence: this.ultimoBloco.payload.sequence + 1,
      timestamp: +new Date(),
      data,
      previousHash: this.getHashUltimoBloco()
    }

    console.log(`Bloco ${novoBloco.sequence} criado: ${JSON.stringify(novoBloco, null, 2)}`)
    return novoBloco
  }

  minerarBloco (bloco: Bloco['payload']) {
    let nonce = 0
    let inicio = +new Date()

    while (true) {
      const hashBloco = hash(JSON.stringify(bloco))
      const hashPow = hash(hashBloco + nonce)

      if (hashValidado({
        hash: hashPow,
        dificuldade: this.dificuldade,
        prefixo: this.prefixoPow
      })) {
        const final = +new Date()
        const hashReduzido = hashBloco.slice(0, 12)
        const tempoMineracao = (final - inicio) / 1000

        console.log(`Bloco ${bloco.sequence} minerado em ${tempoMineracao} segundos. Hash: ${hashReduzido} (${nonce} tentativas)`)

        return {
          blocoMinerado: { payload: { ... bloco}, header: { nonce, hashBloco, hashPow } },
          hashMirenado: hashPow,
          hashReduzido,
          tempoMineracao
        }
      }
      nonce++
    }
  }

  verificarBloco (bloco : Bloco):  boolean {
    if (bloco.payload.previousHash !== this.getHashUltimoBloco()) {
      console.error(`Bloco #${bloco.payload.sequence} inválido: O hash anterior é "${this.getHashUltimoBloco()}" e não "${bloco.payload.previousHash}"`)
      return false
    }

    const hashTeste : string = hash(hash(JSON.stringify(bloco.payload)) + bloco.header.nonce)
    if (!hashValidado({
      hash: hashTeste,
      dificuldade: this.dificuldade,
      prefixo: this.prefixoPow
    })) {
      console.error(`Bloco #${bloco.payload.sequence} inválido: nonce ${bloco.header.nonce} é inválido e não pode ser verificado`)
      return false
    }

    return true
  }

  enviarBloco (bloco : Bloco) {
    if (this.verificarBloco(bloco)) this.#chain.push(bloco)
    console.log(`Bloco #${bloco.payload.sequence} adicionando a blockchain #${JSON.stringify(bloco, null, 2)}`)
    return this.#chain
  }
}
