-- CreateTable
CREATE TABLE "evidencias" (
    "id" TEXT NOT NULL,
    "sinistroId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tipoArquivo" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidencias_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "evidencias" ADD CONSTRAINT "evidencias_sinistroId_fkey" FOREIGN KEY ("sinistroId") REFERENCES "sinistros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
