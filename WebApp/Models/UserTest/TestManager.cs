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
        public dynamic GetTestsByPlaceConfig(string placeConfig, string Localization)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                try
                {
                    return cnt.Query<TestingModel>(sql: "[dbo].[UserPlace_TestingProfilesPlaceConfigGet]", new { placeConfig, Localization }, commandType: CommandType.StoredProcedure);
                }
                catch (Exception e)
                {
                    return new { Error = e.Message };
                }
            }
        }
        public dynamic GetActiveTestsByPlaceConfig(string placeConfig, string Localization)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                try
                {
                    return cnt.Query<TestingModel>(sql: "[dbo].[UserPlace_TestingProfilesPlaceConfigGet]", new { placeConfig, testingStatusId = 2, Localization }, commandType: CommandType.StoredProcedure);
                }
                catch (Exception e)
                {
                    return new { Error = e.Message };
                }
            }
        }
        public dynamic GetActiveTestAnswers(int testingProfileId, string Localization)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                try
                {
                    return cnt.Query<QuestionAnswer>(sql: "[dbo].[UserPlace_TestingLogsGet]", new { testingProfileId, Localization }, commandType: CommandType.StoredProcedure);
                }
                catch (Exception e)
                {
                    return new { Error = e.Message };
                }
            }
        }
        public IEnumerable<TestingPackage> GetTestPackageById(int testingProfileId, string Localization)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<TestingPackage>(sql: "[dbo].[UserPlace_TestingPackagesGet]", new { testingProfileId, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public int ToggleTimer(int testingProfileId, int reasonForStoppingId, Guid? userUID, string localization)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                cnt.Execute(sql: "[dbo].[Administrator_TestingProfilesTimeControlsSave]", new { testingProfileId, reasonForStoppingId, userUID }, commandType: CommandType.StoredProcedure);
                return cnt.Query<int>("UserPlace_TestingTimeRemainingGet", new { testingProfileId, localization, userUID }, commandType: CommandType.StoredProcedure).FirstOrDefault();
            }
        }
        public async Task StartTest(int testingProfileId, Guid userUID, string Localization)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(sql: "[dbo].[UserPlace_TestingStart]", new { testingProfileId, userUID, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task FinishTest(int testingProfileId, string Localization, Guid? userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(sql: "[dbo].[UserPlace_TestingEnd]", new { testingProfileId, userUID, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public IEnumerable<TestingPackage> CheckPIN(int pin, string Localization)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<TestingPackage>(sql: "[dbo].[UserPlace_CheckPin]", new { pin, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public IEnumerable<QuestionModel> GetTestQuestionsById(int testingProfileId, string Localization)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<QuestionModel>(sql: "[dbo].[UserPlace_TestingPackagesQuestionsGet]", new { testingProfileId, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public IEnumerable<AnswerModel> GetTestAnswersById(int testingProfileId, string Localization)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<AnswerModel>(sql: "[dbo].[UserPlace_TestingPackagesAnswersGet]", new { testingProfileId, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task SaveImage(SavePictureModel model)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(sql: "[dbo].[UserPlace_SaveImageData]", new { image = model.Image, model.Id }, commandType: CommandType.StoredProcedure);
            }
        }

        public async Task SendOffer(SavePictureModel model)
        {

        }

        //todo: Перебросить в чат
        public async Task FileUploadAsync(SavePictureModel model, int Type, Guid? guid)
        {
            using (var conn = await Concrete.OpenConnectionAsync())
            {
                using (IDbTransaction trans = conn.BeginTransaction())
                {
                    try
                    {
                        FileStreamResult filestreamResult = (await conn.QueryAsync<FileStreamResult>("UserPlace_SaveStream",
                                            new
                                            {
                                                ContentType = Type == 1? model.CameraFile.ContentType : model.ScreenFile.ContentType,
                                                PlaceConfig = model.Id,
                                                UserId = guid,
                                                extension = ".webm",
                                                type = Type
                                            }, trans, commandType: CommandType.StoredProcedure)).FirstOrDefault();

                        Stream str = Type == 1 ? model.CameraFile.InputStream : model.ScreenFile.InputStream; //model.CameraFile.InputStream;
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
        public FileStreamDownload FileDownload(int testProfileId, int Type, Guid? UserId)
        {
            using (var conn = Concrete.OpenConnection())
            {
                try
                {
                    using (IDbTransaction trans = conn.BeginTransaction())
                    {
                        //Может быть залезть внутрь и вообще биндинг еще сделать для MvcResultSqlFileStream
                        FileStreamDownload filestream = conn.Query<FileStreamDownload>("UserPlace_GetStream", new { testProfileId, UserId, Type }, trans, commandType: CommandType.StoredProcedure).FirstOrDefault();

                        MvcResultSqlFileStream stream = new MvcResultSqlFileStream()
                        {
                            Connection = conn,
                            SqlStream = new SqlFileStream(filestream.FileStreamPath, filestream.FileStreamContext, FileAccess.Read),
                            Transaction = trans
                        };

                       // filestream.Stream = stream;
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
        public IEnumerable<QuestionModel> GetQuestionImage(int questionId, string Localization)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<QuestionModel>(sql: "[dbo].[UserPlace_QuestionImageGet]", new { questionId, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public IEnumerable<AnswerModel> GetAnswerImage(int answerId, string Localization)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<AnswerModel>(sql: "[dbo].[UserPlace_AnswerImageGet]", new { answerId, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<Violation>> GetUserErrors(int TestingProfileId, string Localization, Guid? userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<Violation>(sql: "[dbo].[Administrator_ViolationStatisticGet]", new { TestingProfileId, userUID, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<IndexItem>> GetErrorTypes(string Localization, Guid? UserUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<IndexItem>(sql: "[dbo].[Administrator_ViolationTypesGet]", new { Localization, UserUID }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<Violation>> SetUserErrors(int TestingProfileId, int ViolationTypeId, string Localization, Guid? userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<Violation>(sql: "[dbo].[Administrator_ViolationWithStatisticsSave]", new { TestingProfileId, userUID, ViolationTypeId, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public void UpdateQuestionAnswer(IEnumerable<QuestionAnswer> testingLogs)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                var t = testingLogs.Select(a => new { testingPackageId = a.TestingPackageId, time = DateTime.Now, testingTime = a.TestingTime, userAnswer = a.UserAnswer, fileId = (Guid?)null });
                cnt.Execute(sql: "[dbo].[UserPlace_TestingLogsSave]", new StructuredDynamicParameters(new { testingLogs = t.ToArray() }), commandType: CommandType.StoredProcedure);
            }
        }
        public IEnumerable<ChatMessage> GetChatMessages(int testingProfileId, string Localization)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<ChatMessage>(sql: "[dbo].[Administrator_ChatRoomTestingProfileIdGet]", new { testingProfileId, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public void SendMessage(ChatMessage message)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                cnt.Execute(sql: "[dbo].[Administrator_ChatRoomSave]", new { message.TestingProfileId, message.ParentId, message.UserIdFrom, message.UserIdTo, message.Message, message.Date }, commandType: CommandType.StoredProcedure);
            }
        }
    }
}