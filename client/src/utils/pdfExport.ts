import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * يحول عنصر HTML إلى ملف PDF عبر تصويره (canvas) ثم تقسيمه على صفحات A4.
 * هذا الأسلوب يضمن عرض النص العربي بشكل صحيح (اتجاه ولصق الحروف) لأن المتصفح
 * هو من يرسم النص، بعكس توليد PDF مباشرة من الخادم.
 */
export async function exportElementToPdf(element: HTMLElement, fileName: string) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  });

  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgData = canvas.toDataURL('image/png');

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(fileName);
}

export async function exportElementToPng(element: HTMLElement, fileName: string) {
  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    backgroundColor: null,
  });
  const link = document.createElement('a');
  link.download = fileName;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
