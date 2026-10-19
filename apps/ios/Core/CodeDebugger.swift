import Foundation

public enum CodeDebugger {
    public static func debugCode(code: String, errorLog: String, language: String = "Swift") -> String {
        var diagnosis = "Análise preliminar de falha"
        var proposedFix = "// Correção sugerida"

        if errorLog.contains("Index out of range") || errorLog.contains("IndexError") {
            diagnosis = "Acesso a índice fora dos limites do array/coleção."
            proposedFix = "Adicione verificação de limites (ex: `guard index < array.count` em Swift ou `if index < len(arr)` em Python)."
        } else if errorLog.contains("Nil") || errorLog.contains("NoneType") || errorLog.contains("NullPointerException") {
            diagnosis = "Desempacotamento de opcional nulo (nil/None)."
            proposedFix = "Substitua force unwraps por desempacotamento seguro (`if let`, `guard let` ou optional chaining `?.`)."
        } else if errorLog.contains("SyntaxError") || errorLog.contains("compiler error") || errorLog.contains("error:") {
            diagnosis = "Erro de sintaxe ou incompatibilidade de tipo no código."
            proposedFix = "Verifique o fechamento de chaves/parênteses, tipos esperados e assinaturas de métodos."
        } else if errorLog.contains("SIGSEGV") || errorLog.contains("Segmentation fault") {
            diagnosis = "Violação de acesso à memória (Segmentation Fault)."
            proposedFix = "Inspecione ponteiros C, referências fracas/circulares ou ponteiros nulos."
        } else {
            diagnosis = "Falha detectada no log: \(errorLog.prefix(120))..."
            proposedFix = "Analise o stack trace no ponto de execução para identificar o estado inesperado."
        }

        return """
        # Diagnóstico de Debugging (Kaide)
        - **Linguagem:** \(language)
        - **Hipótese:** \(diagnosis)
        - **Recomendação:** \(proposedFix)

        ### Log Analisado:
        ```
        \(errorLog)
        ```

        \(code.isEmpty ? "" : "### Código Analisado:\n```\(language.lowercased())\n\(code)\n```")
        """
    }
}
