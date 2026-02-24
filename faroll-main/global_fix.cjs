const fs = require('fs');

const filesToFix = [
    'd:\\farollbr\\src\\components\\screens\\ConfigScreen.tsx',
    'd:\\farollbr\\src\\components\\screens\\ManageScheduleScreen.tsx'
];

filesToFix.forEach(filePath => {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Se o botão de desconectar não estiver no arquivo, vamos inserir à força
        if (!content.includes('Desconectar Google') && !content.includes('Desconectar')) {
            console.log(`Corrigindo ${filePath}...`);

            // Inserção na ConfigScreen
            if (filePath.includes('ConfigScreen.tsx')) {
                const target = 'Sincronizar Agora';
                const replacement = `Sincronizar Agora
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-red-500 mt-2"
                      onClick={() => app.toggleGoogleSync(false)}
                    >
                      LIMPAR E RECONECTAR GOOGLE`;
                content = content.replace(target, replacement);
            }

            // Inserção na ManageScheduleScreen
            if (filePath.includes('ManageScheduleScreen.tsx')) {
                const target = 'Sincronizar';
                const replacement = `Sincronizar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                  onClick={() => toggleGoogleSync(false)}
                >
                  LIMPAR TUDO`;
                content = content.replace(target, replacement);
            }

            fs.writeFileSync(filePath, content, 'utf8');
        }
    }
});

console.log('Varredura e correção global concluída.');
