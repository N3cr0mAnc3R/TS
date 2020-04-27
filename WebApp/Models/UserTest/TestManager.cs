using Dapper;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlTypes;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using WebApp.Models.Common;
using WebApp.Models.DB;
using WebApp.Models.UserTest;

namespace WebApp.Models
{
    public class TestManager : Manager
    {
        public TestManager(Concrete concrete) : base(concrete) { }
        public dynamic GetTestsByPlaceConfig(string placeConfig)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                try
                {
                    return cnt.Query<TestingModel>(sql: "[dbo].[UserPlace_TestingProfilesPlaceConfigGet]", new { placeConfig }, commandType: CommandType.StoredProcedure);
                }
                catch (Exception e)
                {
                    return new { Error = e.Message };
                }
            }
        }
        public dynamic GetActiveTestsByPlaceConfig(string placeConfig)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                try
                {
                    return cnt.Query<TestingModel>(sql: "[dbo].[UserPlace_TestingProfilesPlaceConfigGet]", new { placeConfig, testingStatusId = 2 }, commandType: CommandType.StoredProcedure);
                }
                catch (Exception e)
                {
                    return new { Error = e.Message };
                }
            }
        }
        public dynamic GetActiveTestAnswers(int testingProfileId)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                try
                {
                    return cnt.Query<QuestionAnswer>(sql: "[dbo].[UserPlace_TestingLogsGet]", new { testingProfileId }, commandType: CommandType.StoredProcedure);
                }
                catch (Exception e)
                {
                    return new { Error = e.Message };
                }
            }
        }
        public IEnumerable<TestingPackage> GetTestPackageById(int testingProfileId)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<TestingPackage>(sql: "[dbo].[UserPlace_TestingPackagesGet]", new { testingProfileId }, commandType: CommandType.StoredProcedure);
            }
        }
        public void StopTimer(int testingProfileId, int reasonForStoppingId, Guid? userUID)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                cnt.Execute(sql: "[dbo].[Administrator_TestingProfilesTimeControlsSave]", new { testingProfileId, reasonForStoppingId, userUID }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task StartTest(int testingProfileId, Guid userUID)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                cnt.Execute(sql: "[dbo].[UserPlace_TestingStart]", new { testingProfileId, userUID }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task FinishTest(int testingProfileId, Guid userUID)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                cnt.Execute(sql: "[dbo].[UserPlace_TestingEnd]", new { testingProfileId, userUID }, commandType: CommandType.StoredProcedure);
            }
        }
        public IEnumerable<TestingPackage> CheckPIN(int pin)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<TestingPackage>(sql: "[dbo].[UserPlace_CheckPin]", new { pin }, commandType: CommandType.StoredProcedure);
            }
        }
        public IEnumerable<QuestionModel> GetTestQuestionsById(int testingProfileId)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<QuestionModel>(sql: "[dbo].[UserPlace_TestingPackagesQuestionsGet]", new { testingProfileId }, commandType: CommandType.StoredProcedure);
            }
        }
        public IEnumerable<AnswerModel> GetTestAnswersById(int testingProfileId)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<AnswerModel>(sql: "[dbo].[UserPlace_TestingPackagesAnswersGet]", new { testingProfileId }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task SaveImage(SavePictureModel model)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(sql: "[dbo].[UserPlace_SaveImageData]", new { image = model.Image, Id = model.Id }, commandType: CommandType.StoredProcedure);
            }
        }

        public async Task SendOffer(SavePictureModel model)
        {

        }

        //todo: Перебросить в чат
        public async Task FileUploadAsync(SavePictureModel model, Guid? guid)
        {
            using (var conn = await Concrete.OpenConnectionAsync())
            {
                //try
                //{
                //    byte[] file = new byte[model.File.InputStream.Length];
                //    using (MemoryStream ms = new MemoryStream())
                //    {
                //        int read;
                //        while ((read = model.File.InputStream.Read(file, 0, file.Length)) > 0)
                //        {
                //            ms.Write(file, 0, read);
                //        }
                //        file = ms.ToArray();
                //    }
                //    await conn.ExecuteAsync("UserPlace_SaveStream", new { file, PlaceConfig = model.Id, UserId = guid }, commandType: CommandType.StoredProcedure);
                //}
                //catch (Exception e)
                //{
                //    var t = e.Message;
                //}
                using (IDbTransaction trans = conn.BeginTransaction())
                {
                    try
                    {
                        FileStreamResult filestreamResult = (await conn.QueryAsync<FileStreamResult>("UserPlace_SaveStream",
                                            new
                                            {
                                                ContentType = model.File.ContentType,
                                                PlaceConfig = model.Id,
                                                UserId = guid,
                                                extension = ".webm",
                                                model.baseFile
                                            }, trans, commandType: CommandType.StoredProcedure)).FirstOrDefault();

                        Stream str = model.File.InputStream;
                        using (SqlFileStream sqlFilestream = new SqlFileStream(filestreamResult.FileStreamPath, filestreamResult.FileStreamContext, FileAccess.Write, FileOptions.SequentialScan, 0))
                        {
                            await str.CopyToAsync(sqlFilestream, 2000);
                        }
                        trans.Commit();

                        //catch (Exception ex)
                        //{
                        //    return ex;
                        //}
                        //return JsonConvert.SerializeObject(new { name = filestreamResult.Name, success = true });
                    }
                    catch (Exception ex)
                    {
                        // return JsonConvert.SerializeObject(new { errorMsg = ex.Message, success = false });
                    }
                }
            }
        }
        public string GetFileBase(int testProfileId)
        {
            using (var conn = Concrete.OpenConnection())
            {
                return conn.Query<string>("UserPlace_GetStreamBase", new { testProfileId, }, commandType: CommandType.StoredProcedure).FirstOrDefault();
            }
        }
        public FileStreamDownload FileDownload(int testProfileId, Guid? UserId)
        {
            using (var conn = Concrete.OpenConnection())
            {
                try
                {
                    using (IDbTransaction trans = conn.BeginTransaction())
                    {
                        //Может быть залезть внутрь и вообще биндинг еще сделать для MvcResultSqlFileStream
                        FileStreamDownload filestream = conn.Query<FileStreamDownload>("UserPlace_GetStream", new { testProfileId, UserId }, trans, commandType: CommandType.StoredProcedure).FirstOrDefault();

                        MvcResultSqlFileStream stream = new MvcResultSqlFileStream()
                        {
                            Connection = conn,
                            SqlStream = new SqlFileStream(filestream.FileStreamPath, filestream.FileStreamContext, FileAccess.Read),
                            Transaction = trans
                        };

                        byte[] data = new byte[(int)stream.Length];
                        stream.Read(data, 0, data.Length);
                        filestream.Stream = stream;
                        // Теперь помечаем, используемые ресурсы, т

                        return filestream;
                    }
                }
                catch (Exception e)
                {
                    return null;
                }
            }
        }
        public byte[] GetImage(int Id)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                byte[] array = cnt.Query<byte[]>(sql: "[dbo].[UserPlace_GetImageData]", new { Id }, commandType: CommandType.StoredProcedure).FirstOrDefault();

                return array;

            }
        }
        //public async Task<string> GetImage(int Id)
        //{
        //    using (var cnt = await Concrete.OpenConnectionAsync())
        //    {
        //        return (await cnt.QueryAsync<string>(sql: "[dbo].[UserPlace_GetImageData]", new { Id }, commandType: CommandType.StoredProcedure)).FirstOrDefault();
        //    }
        //}
        public IEnumerable<QuestionModel> GetQuestionImage(int questionId)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<QuestionModel>(sql: "[dbo].[UserPlace_QuestionImageGet]", new { questionId }, commandType: CommandType.StoredProcedure);
            }
        }
        public IEnumerable<AnswerModel> GetAnswerImage(int answerId)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<AnswerModel>(sql: "[dbo].[UserPlace_AnswerImageGet]", new { answerId }, commandType: CommandType.StoredProcedure);
            }
        }
        public void UpdateQuestionAnswer(IEnumerable<QuestionAnswer> testingLogs)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                var t = testingLogs.Select(a => new { testingPackageId = a.TestingPackageId, time = DateTime.Now, testingTime = a.TestingTime, userAnswer = a.UserAnswer });
                cnt.Execute(sql: "[dbo].[UserPlace_TestingLogsSave]", new StructuredDynamicParameters(new { testingLogs = t.ToArray() }), commandType: CommandType.StoredProcedure);
            }
        }
    }
}