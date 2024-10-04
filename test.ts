

class HandleNumber {
    data: number[] = []
}

class HandleString {
    data: string[] = []
}

class HandleAnything<T> {
    data: T[] = []
}

const handleNumber = new HandleAnything<number>()
handleNumber.data.push(45)

new HandleAnything<string>().data.push("toto")