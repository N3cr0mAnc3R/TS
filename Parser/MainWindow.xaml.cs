using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Configuration;
using System.Data.SqlClient;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;

namespace Parser
{
    /// <summary>
    /// Логика взаимодействия для MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        int countTotal = 0;
        bool IsStraight = true;
        public MainWindow()
        {
            InitializeComponent();

            SqlConnection conn = new SqlConnection(ConfigurationManager.ConnectionStrings["Testing"].ConnectionString);
            SqlCommand cmd = conn.CreateCommand();

            cmd.CommandText = "select sum(total) from (select count(1) as total from questions nolock where questionImage is null and question is not null union all select count(1) as total from Answers nolock where answerImage is null and answer is not null) as t";

            conn.Open();
            using (var reader = cmd.ExecuteReader())
            {
                reader.Read();
                countTotal = reader.GetInt32(0);
                ttal.Text = "Всего файлов: " + countTotal.ToString();
            }
            bck.DoWork += Process1;
            bck.ProgressChanged += backgroundWorker1_ProgressChanged;
            bck.WorkerReportsProgress = true;
            bck.WorkerSupportsCancellation = true;
            bck.RunWorkerCompleted += Bck_RunWorkerCompleted;
            //Close();

        }
        int finished;
       // int Id1 = 0;

        private void Bck_RunWorkerCompleted(object sender, RunWorkerCompletedEventArgs e)
        {
            if (progressBar2.Value == 100)
            {
                finished++;
                left.Text = finished + " обработано, осталось ";
                bck.RunWorkerAsync();
            }
        }

        BackgroundWorker bck = new BackgroundWorker();
        List<Test> tests;
        private void Button_Click(object sender, RoutedEventArgs e)
        {
            //var task = Process1();
            //task.Start();
            errors.Text = "Начало положено\n";
            bck.RunWorkerAsync();
        }
        private void Button_Click2(object sender, RoutedEventArgs e)
        {
            SqlConnection conn = new SqlConnection(ConfigurationManager.ConnectionStrings["Testing"].ConnectionString);
            SqlCommand cmd = conn.CreateCommand();
            cmd.CommandText = "exec Debug_Qwestion_GetBlob " + Id1.Text;
            conn.Open();
            using (var reader = cmd.ExecuteReader())
            {
                int i = 1;
                while (reader.Read())
                {
                    //File.WriteAllBytes("D:\\test4.doc", (byte[])reader["QUESTION1"]);
                    //File.WriteAllBytes("D:\\test4.doc", (byte[])reader["question"]);
                    File.WriteAllBytes("D:\\test4" + i + ".doc", (byte[])reader["question"]);
                    i++;
                }
            }
        }
        private void Button_Click1(object sender, RoutedEventArgs e)
        {
            //var task = Process1();
            //task.Start();
            bck.CancelAsync();
        }

        private AutoResetEvent _resetEvent = new AutoResetEvent(false);
        private void backgroundWorker1_ProgressChanged(object sender, System.ComponentModel.ProgressChangedEventArgs e)
        {
            progressBar2.Value = e.ProgressPercentage;
            string msg = "";
            int ForSwitch = e.ProgressPercentage;
            int Id = 0;
            if (ForSwitch > 100)
            {
                Id = ForSwitch;
                ForSwitch = 13;
            }
            switch (ForSwitch)
            {
                case 0: msg = "Начинаем. "; break;
                case 13: msg = "Файлик считан. Начинаем конвертацию в изображение..."; break;
                case 50: msg = "Файл переделан в картинку. Думаем, как обрезать..."; break;
                case 79: msg = "Придумали. Обрезаем..."; break;
                case 91: msg = "Картинка обрезана. Конвертируем..."; break;
                case 98: msg = "Сконвертировали. Сохраняем в базу"; break;
                case 99:
                    msg = "Сохранено. Удаляем ненужные файлы";

                    SqlConnection conn = new SqlConnection(ConfigurationManager.ConnectionStrings["Testing"].ConnectionString);
                    SqlCommand cmd = conn.CreateCommand();
                    cmd.CommandText = "select sum(total) from (select count(1) as total from questions nolock where questionImage is null and question is not null union all select count(1) as total from Answers nolock where answerImage is null and answer is not null) as t";
                    conn.Open();
                    int count = 0;
                    using (var reader = cmd.ExecuteReader())
                    {
                        reader.Read();
                        count = reader.GetInt32(0);
                        left1.Text = count.ToString();
                    }
                    conn.Close();
                    break;
            }
            errors.Text = msg;
            if (Id != 0)
            {
                errors1.Text = Id.ToString();
            }
        }
        private void Proc_Exited(object sender, EventArgs e)
        {
            Process p = (Process)sender;
            p.Exited -= Proc_Exited;
            p.Dispose();
            //Process.Start("taskkill", "/IM gswin64.exe");
        }
        string dpi1 = "300";
        public void Process1(object sender, System.ComponentModel.DoWorkEventArgs e)
        {
            try
            {
                bck.ReportProgress(0);
                SqlConnection conn = new SqlConnection(ConfigurationManager.ConnectionStrings["Testing"].ConnectionString);
                SqlCommand cmd = conn.CreateCommand();
                //cmd.CommandText = "select top 1 KOD_TEST, Question1 from tests where QuestionIMG is null";
                //cmd.CommandText = "select top 1 KOD_ANS, ANSWER1 from testans where ANSWERIMG is null";
                if (IsChecked)
                {
                    cmd.CommandText = "select top 1 ID, question from [Questions] where [questionImage] is null and question is not null" + (IsStraight? "" : " order by ID desc");
                }
                else
                {
                    cmd.CommandText = "select top 1 ID, answer from [Answers] where [answerImage] is null and answer is not null" + (IsStraight ? "" : " order by ID desc");
                }
                conn.Open();
                string input = "D:\\test4.pdf", output = "D:\\test";

                //File.WriteAllBytes(input, cmd.ExecuteScalar() as byte[]);
                int Id = 0;
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        Id = (int)reader["ID"];
                        if (IsChecked)
                        {
                            File.WriteAllBytes("D:\\test4.doc", (byte[])reader["question"]);

                        }
                        else
                        {
                            File.WriteAllBytes("D:\\test4.doc", (byte[])reader["answer"]);
                        }
                        //File.WriteAllBytes("D:\\test4.doc", (byte[])reader["QUESTION1"]);
                        //File.WriteAllBytes("D:\\test4.doc", (byte[])reader["question"]);
                        //Id1 =(int)reader["questionId"];
                    }
                }
                bck.ReportProgress(Id);
                if (Id == 0)
                {
                    return;
                }
                Parsing parser = new Parsing();
                parser.ParseAsync("D:\\test4.doc", input);


                string ghostScriptPath = IsUra? @"C:\Program Files\gs\gs9.50\bin\gswin64.exe" : @"D:\Old\gs9.50\bin\gswin64.exe";
                //string ghostScriptPath = @"C:\Program Files\gs\gs9.50\bin\gswin64.exe";
                String ars = "-dNOPAUSE -sDEVICE=jpeg -r" + dpi1 + " -o  " + output + ".jpg -sPAPERSIZE=a4 " + input;
                Process proc = new Process();
                proc.StartInfo.FileName = ghostScriptPath;
                proc.StartInfo.Arguments = ars;
                proc.StartInfo.CreateNoWindow = true;
                proc.StartInfo.WindowStyle = ProcessWindowStyle.Hidden;
                proc.Start();
                proc.EnableRaisingEvents = true;
                // proc.Exited += Proc_Exited;
                if (!proc.WaitForExit(4000))
                {
                    proc.CloseMainWindow();
                    proc.Close();
                    if (!proc.WaitForExit(4000))
                    {
                        proc.Kill();
                    }
                }
                bck.ReportProgress(50);
                int maxHeight = 0;

                using (Image img1 = Image.FromFile(output + ".jpg"))
                {
                    using (Bitmap bmp = new Bitmap(img1))
                    {

                        LockBitmap bmp1 = new LockBitmap(bmp);
                        bmp1.LockBits();
                        int step = bmp1.Depth == 32 ? 4 : bmp1.Depth == 24 ? 3 : 1;
                        for (int i = bmp1.Width * bmp1.Height; i >= 0; i -= step)
                        {
                            if (bmp1.Pixels[i] != 255)
                            {
                                maxHeight = i;
                                break;
                            }
                        }
                        maxHeight = (int)Math.Ceiling((double)(maxHeight / bmp1.Width));
                        if (maxHeight + 30 <= bmp1.Height)
                        {
                            maxHeight += 30;
                        }
                        bck.ReportProgress(79);

                        Bitmap cropBmp = bmp.Clone(new System.Drawing.Rectangle(0, 0, bmp.Width, maxHeight), bmp.PixelFormat);
                        //cropBmp.Save(output + "1.bmp");

                        ImageConverter converter = new ImageConverter();
                        bck.ReportProgress(91);

                        SqlCommand cmd1 = conn.CreateCommand();
                        byte[] bytes;
                        using (var stream = new MemoryStream())
                        {
                            cropBmp.Save(stream, System.Drawing.Imaging.ImageFormat.Png);
                            bytes = stream.ToArray();
                        }
                        bck.ReportProgress(98);


                        string img = Convert.ToBase64String(bytes);
                        if (IsChecked)
                        {
                            cmd1.CommandText = "update Questions set questionImage = '" + img + "'  where ID = " + Id;
                        }
                        else
                        {
                            cmd1.CommandText = "update Answers set answerImage = '" + img + "'  where ID = " + Id;
                        }
                        //cmd1.CommandText = "update tests set QuestionIMG = '" + img + "'  where KOD_TEST = " + Id;
                        //cmd1.CommandText = "update testans set ANSWERIMG = '" + img + "'  where KOD_ANS = " + Id;
                        //cmd1.CommandText = "update Questions set questionImage = '" + img + "'  where ID = " + Id;
                        cmd1.ExecuteScalar();
                        bck.ReportProgress(99);
                    }
                }

                File.Delete(input);
                File.Delete("D:\\test4.doc");
                File.Delete(output + ".jpg");
                bck.ReportProgress(100);


            }
            catch (IOException exc)
            {

                File.Delete("D:\\test4.doc");
                MessageBox.Show(exc.Message);
                //Process1(sender, e);
            }
            catch(Exception exc)
            {
                var t = 1;
            }
        }


        private void save(object sender, MouseButtonEventArgs e)
        {
        }
        bool IsChecked = false;
        private void IsQwestion_Checked(object sender, RoutedEventArgs e)
        {
            IsChecked = !IsChecked;
        }

        private void dpi_TextChanged(object sender, System.Windows.Controls.TextChangedEventArgs e)
        {
            dpi1 = ((System.Windows.Controls.TextBox)sender).Text;
        }

        private void IsStraight_Checked(object sender, RoutedEventArgs e)
        {
            IsStraight = !IsStraight;

        }
        bool IsUra = true;
        private void IsNorm_Checked(object sender, RoutedEventArgs e)
        {
            IsUra = !IsUra;
        }
    }
    public class LockBitmap
    {
        Bitmap source = null;
        IntPtr Iptr = IntPtr.Zero;
        BitmapData bitmapData = null;

        public byte[] Pixels { get; set; }
        public int Depth { get; private set; }
        public int Width { get; private set; }
        public int Height { get; private set; }

        public LockBitmap(Bitmap source)
        {
            this.source = source;
        }

        /// <summary>
        /// Lock bitmap data
        /// </summary>
        public void LockBits()
        {
            try
            {
                // Get width and height of bitmap
                Width = source.Width;
                Height = source.Height;

                // get total locked pixels count
                int PixelCount = Width * Height;

                // Create rectangle to lock
                Rectangle rect = new Rectangle(0, 0, Width, Height);

                // get source bitmap pixel format size
                Depth = System.Drawing.Bitmap.GetPixelFormatSize(source.PixelFormat);

                // Check if bpp (Bits Per Pixel) is 8, 24, or 32
                if (Depth != 8 && Depth != 24 && Depth != 32)
                {
                    throw new ArgumentException("Only 8, 24 and 32 bpp images are supported.");
                }

                // Lock bitmap and return bitmap data
                bitmapData = source.LockBits(rect, ImageLockMode.ReadWrite,
                                             source.PixelFormat);

                // create byte array to copy pixel values
                int step = Depth / 8;
                Pixels = new byte[PixelCount * step];
                Iptr = bitmapData.Scan0;

                // Copy data from pointer to array
                Marshal.Copy(Iptr, Pixels, 0, Pixels.Length);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        /// <summary>
        /// Unlock bitmap data
        /// </summary>
        public void UnlockBits()
        {
            try
            {
                // Copy data from byte array to pointer
                Marshal.Copy(Pixels, 0, Iptr, Pixels.Length);

                // Unlock bitmap data
                source.UnlockBits(bitmapData);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        /// <summary>
        /// Get the color of the specified pixel
        /// </summary>
        /// <param name="x"></param>
        /// <param name="y"></param>
        /// <returns></returns>
        public Color GetPixel(int x, int y)
        {
            Color clr = Color.Empty;

            // Get color components count
            int cCount = Depth / 8;

            // Get start index of the specified pixel
            int i = ((y * Width) + x) * cCount;

            if (i > Pixels.Length - cCount)
                throw new IndexOutOfRangeException();

            if (Depth == 32) // For 32 bpp get Red, Green, Blue and Alpha
            {
                byte b = Pixels[i];
                byte g = Pixels[i + 1];
                byte r = Pixels[i + 2];
                byte a = Pixels[i + 3]; // a
                clr = Color.FromArgb(a, r, g, b);
            }
            if (Depth == 24) // For 24 bpp get Red, Green and Blue
            {
                byte b = Pixels[i];
                byte g = Pixels[i + 1];
                byte r = Pixels[i + 2];
                clr = Color.FromArgb(r, g, b);
            }
            if (Depth == 8)
            // For 8 bpp get color value (Red, Green and Blue values are the same)
            {
                byte c = Pixels[i];
                clr = Color.FromArgb(c, c, c);
            }
            return clr;
        }

        /// <summary>
        /// Set the color of the specified pixel
        /// </summary>
        /// <param name="x"></param>
        /// <param name="y"></param>
        /// <param name="color"></param>
        public void SetPixel(int x, int y, Color color)
        {
            // Get color components count
            int cCount = Depth / 8;

            // Get start index of the specified pixel
            int i = ((y * Width) + x) * cCount;

            if (Depth == 32) // For 32 bpp set Red, Green, Blue and Alpha
            {
                Pixels[i] = color.B;
                Pixels[i + 1] = color.G;
                Pixels[i + 2] = color.R;
                Pixels[i + 3] = color.A;
            }
            if (Depth == 24) // For 24 bpp set Red, Green and Blue
            {
                Pixels[i] = color.B;
                Pixels[i + 1] = color.G;
                Pixels[i + 2] = color.R;
            }
            if (Depth == 8)
            // For 8 bpp set color value (Red, Green and Blue values are the same)
            {
                Pixels[i] = color.B;
            }
        }
    }
}
