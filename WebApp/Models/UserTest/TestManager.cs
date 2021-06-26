using Newtonsoft.Json;
using Dapper;
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
using WebApp.Models.Proctoring;

namespace WebApp.Models
{
    public class TestManager : Manager
    {
        public TestManager(Concrete concrete) : base(concrete) { }
        public async Task<dynamic> GetTestsByPlaceConfig(string placeConfig, Guid userUID, string Localization = "RU")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                try
                {
                    return await cnt.QueryAsync<TestingModel>(sql: "[dbo].[UserPlace_TestingProfilesPlaceConfigGet]", new { placeConfig, Localization, userUID }, commandType: CommandType.StoredProcedure);
                }
                catch (Exception e)
                {
                    return new { Error = e.Message };
                }
            }
        }
        public async Task<dynamic> GetTestsByUserId(Guid userUID, string Localization = "RU")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                try
                {
                    return await cnt.QueryAsync<TestingModel>(sql: "[dbo].[UserPlace_TestingProfilesGet]", new { Localization, userUID }, commandType: CommandType.StoredProcedure);
                }
                catch (Exception e)
                {
                    return new { Error = e.Message };
                }
            }
        }
        public async Task<dynamic> GetActiveTestsByPlaceConfig(Guid userUID, string Localization = "RU")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                try
                {
                    return await cnt.QueryAsync<TestingModel>(sql: "[dbo].[UserPlace_TestingProfilesGet]", new { testingStatusId = 2, Localization, userUID }, commandType: CommandType.StoredProcedure);
                }
                catch (Exception e)
                {
                    return new { Error = e.Message };
                }
            }
        }
        public async Task SaveError(string Content, int? TestingProfileId = null)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(sql: "[dbo].[UserPlace_SaveLogError]", new { TestingProfileId, Content }, commandType: CommandType.StoredProcedure);

            }
        }
        public async Task<dynamic> GetActiveTestsByPlaceConfig(string placeConfig, Guid userUID, string Localization = "RU")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                try
                {
                    return await cnt.QueryAsync<TestingModel>(sql: "[dbo].[UserPlace_TestingProfilesPlaceConfigGet]", new { placeConfig, testingStatusId = 2, Localization, userUID }, commandType: CommandType.StoredProcedure);
                }
                catch (Exception e)
                {
                    return new { Error = e.Message };
                }
            }
        }
        public async Task<dynamic> GetActiveTestAnswers(int testingProfileId, string Localization = "RU")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                try
                {
                    return await cnt.QueryAsync<QuestionAnswer>(sql: "[dbo].[UserPlace_TestingLogsGet]", new { testingProfileId, Localization }, commandType: CommandType.StoredProcedure);
                }
                catch (Exception e)
                {
                    return new { Error = e.Message };
                }
            }
        }
        public async Task<IEnumerable<TestingPackage>> GetTestPackageById(int testingProfileId, string Localization = "RU")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<TestingPackage>(sql: "[dbo].[UserPlace_TestingPackagesGet]", new { testingProfileId, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<Guid> GetUserInfoByTestingProfile(int testingProfileId, string Localization = "RU")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryFirstOrDefaultAsync<Guid>(sql: "[dbo].[UserPlace_UserUIDTestingProfileIdGet]", new { testingProfileId, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<int> ToggleTimer(int testingProfileId, int reasonForStoppingId, Guid? userUID, string localization)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(sql: "[dbo].[Administrator_TestingProfilesTimeControlsSave]", new { testingProfileId, reasonForStoppingId, userUID }, commandType: CommandType.StoredProcedure);
                return await cnt.QueryFirstOrDefaultAsync<int>("UserPlace_TestingTimeRemainingGet", new { testingProfileId, localization, userUID }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task StartTest(int testingProfileId, Guid? userUID, string Localization = "RU")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(sql: "[dbo].[UserPlace_TestingStart]", new { testingProfileId, userUID, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task FinishTest(int testingProfileId, Guid? userUID, string Localization = "RU")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(sql: "[dbo].[UserPlace_TestingEnd]", new { testingProfileId, userUID, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<ProfileTest>> GetUserTests(Guid userUID, string Localization = "RU")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<ProfileTest>(sql: "[dbo].[UserPlace_TestingProfileHistoryGet]", new { userUID, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public IEnumerable<TestingPackage> CheckPIN(int pin, string Localization = "RU")
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<TestingPackage>(sql: "[dbo].[UserPlace_CheckPin]", new { pin, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<QuestionModel>> GetTestQuestionsById(int testingProfileId, string Localization = "RU")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<QuestionModel>(sql: "[dbo].[UserPlace_TestingPackagesQuestionsGet]", new { testingProfileId, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<AnswerModel>> GetTestAnswersById(int testingProfileId, string Localization = "RU")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<AnswerModel>(sql: "[dbo].[UserPlace_TestingPackagesAnswersGet]", new { testingProfileId, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task SaveImage(SavePictureModel model)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(sql: "[dbo].[UserPlace_SaveImageData]", new { image = model.Image, model.Id }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task ResetPlaceRequest(Guid userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(sql: "[dbo].[UserPlace_ResetRequest_Update]", new { userUID, isRequest = true }, commandType: CommandType.StoredProcedure);
            }
        }


        //todo: Перебросить в чат
        public async Task<Guid> FileAnswerUploadAsync(SavePictureModel model, Guid? guid)
        {
            using (var conn = await Concrete.OpenConnectionAsync())
            {
                using (IDbTransaction trans = conn.BeginTransaction())
                {
                    try
                    {
                        using (var multi = await conn.QueryMultipleAsync("UserPlace_FileSave",
                                            new
                                            {
                                                model.AnswerFile.ContentType,
                                                UserId = guid,
                                                TestingPackageId = model.Id,
                                                extension = model.AnswerFileExtension
                                            }, trans, commandType: CommandType.StoredProcedure))
                        {
                            FileStreamResult filestreamResult = multi.Read<FileStreamResult>().FirstOrDefault();
                            Stream str = model.AnswerFile.InputStream;
                            using (SqlFileStream sqlFilestream = new SqlFileStream(filestreamResult.FileStreamPath, filestreamResult.FileStreamContext, FileAccess.Write, FileOptions.SequentialScan, 0))
                            {
                                await str.CopyToAsync(sqlFilestream, 2000);
                            }
                            Guid result = multi.ReadFirstOrDefault<Guid>();
                            trans.Commit();
                            return result;
                        }
                        //catch (Exception ex)
                        //{
                        //    return ex;
                        //}
                        //return JsonConvert.SerializeObject(new { name = filestreamResult.Name, success = true });
                    }
                    catch (Exception ex)
                    {
                        return Guid.Empty;
                        // return JsonConvert.SerializeObject(new { errorMsg = ex.Message, success = false });
                    }
                }
            }
        }
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
                                                ContentType = Type == 1 ? model.CameraFile.ContentType : model.ScreenFile.ContentType,
                                                PlaceConfig = model.Id,
                                                UserId = guid,
                                                FileName = Type == 1 ? model.CameraFile.FileName : model.ScreenFile.FileName,
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
        public async Task<IEnumerable<FileStreamResult>> GetFilesByTestingProfile(int testingProfileId, int Type)
        {
            using (var conn = await Concrete.OpenConnectionAsync())
            {
                return await conn.QueryAsync<FileStreamResult>("Administrator_DownloadAllVideos", new { testingProfileId, Type }, commandType: CommandType.StoredProcedure);
            }
        }
        public FileStreamDownload FileDownload(int testProfileId, int Type, Guid? UserId)
        {
            using (var conn = Concrete.OpenConnection())
            {
                try
                {
                    IDbTransaction trans = conn.BeginTransaction();

                    //Может быть залезть внутрь и вообще биндинг еще сделать для MvcResultSqlFileStream
                    FileStreamDownload filestream = conn.Query<FileStreamDownload>("UserPlace_GetStream", new { testProfileId, UserId, Type }, trans, commandType: CommandType.StoredProcedure).FirstOrDefault();

                    MvcResultSqlFileStream stream = new MvcResultSqlFileStream()
                    {
                        Connection = conn,
                        SqlStream = new SqlFileStream(filestream.FileStreamPath, filestream.FileStreamContext, FileAccess.Read),
                        Transaction = trans
                    };

                    // filestream.Stream = stream;
                    //byte[] data = new byte[(int)stream.Length];
                    //       stream.Read(data, 0, data.Length);
                    filestream.Stream = stream;
                    // Теперь помечаем, используемые ресурсы, т
                    //trans.Commit();
                    trans = null;
                    return filestream;

                }
                catch (Exception e)
                {
                    return null;
                }
            }
        }
        public async Task<byte[]> DownloadFileById(Guid? FileId, Guid? UserId)
        {
            using (var conn = await Concrete.OpenConnectionAsync())
            {
                IDbTransaction trans = conn.BeginTransaction();
                try
                {
                    //Может быть залезть внутрь и вообще биндинг еще сделать для MvcResultSqlFileStream
                    byte[] filestream = await conn.QueryFirstOrDefaultAsync<byte[]>("UserPlace_FileGet", new { FileId, UserId }, trans, commandType: CommandType.StoredProcedure);

                    //return Convert.ToBase64String(filestream);
                    return filestream;

                    //FileStreamDownload filestream = conn.Query<FileStreamDownload>("UserPlace_FileGet", new { FileId, UserId }, trans, commandType: CommandType.StoredProcedure).FirstOrDefault();

                    //MvcResultSqlFileStream stream = new MvcResultSqlFileStream()
                    //{
                    //    Connection = conn,
                    //    SqlStream = new SqlFileStream(filestream.FileStreamPath, filestream.FileStreamContext, FileAccess.Read),
                    //    Transaction = trans
                    //};

                    //// filestream.Stream = stream;
                    //// byte[] data = new byte[(int)stream.Length];
                    //// stream.Read(data, 0, data.Length);
                    //filestream.Stream = stream;
                    //// Теперь помечаем, используемые ресурсы, т

                    //return filestream;

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
        //public async Task<string> GetQrCode(int Id, Guid userUID)
        //{
        //    using (var cnt = await Concrete.OpenConnectionAsync())
        //    {
        //        return await cnt.QueryFirstOrDefaultAsync<string>(sql: "[dbo].[]", new { Id, userUID }, commandType: CommandType.StoredProcedure);
        //    }
        //}
        public async Task SaveQrCode(int TestingProfileId, int TestingPackageId, string qrCode)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(sql: "[dbo].[UserPlace_QRCodeSave]", new { TestingProfileId, TestingPackageId, qrCode }, commandType: CommandType.StoredProcedure);
            }
        }
        //public async Task<string> GetImage(int Id)
        //{
        //    using (var cnt = await Concrete.OpenConnectionAsync())
        //    {
        //        return (await cnt.QueryAsync<string>(sql: "[dbo].[UserPlace_GetImageData]", new { Id }, commandType: CommandType.StoredProcedure)).FirstOrDefault();
        //    }
        //}
        public async Task<IEnumerable<QuestionModel>> GetQuestionImage(int questionId, string Localization = "RU")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                var t = await cnt.QueryAsync<QuestionModel>(sql: "[dbo].[UserPlace_QuestionImageGet]", new { questionId, Localization }, commandType: CommandType.StoredProcedure);
                return t;
            }
        }
        public async Task<string> GetUserAnswer(Guid fileId, Guid userUID, string Localization = "RU")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                var t = Convert.ToBase64String(await cnt.QueryFirstOrDefaultAsync<byte[]>(sql: "[dbo].[UserPlace_UserAnswerRemoteFileGet]", new { fileId, userUID, Localization }, commandType: CommandType.StoredProcedure));
                return t;
            }
        }
        public async Task<IEnumerable<AnswerModel>> GetAnswerImage(int answerId, string Localization = "RU")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<AnswerModel>(sql: "[dbo].[UserPlace_AnswerImageGet]", new { answerId, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<Violation>> GetUserErrors(int TestingProfileId, Guid? userUID, string Localization = "RU")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<Violation>(sql: "[dbo].[Administrator_ViolationStatisticGet]", new { TestingProfileId, userUID, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<IndexItem>> GetErrorTypes(Guid? UserUID, string Localization = "RU")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<IndexItem>(sql: "[dbo].[Administrator_ViolationTypesGet]", new { Localization, UserUID }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<Violation>> SetUserErrors(int TestingProfileId, int ViolationTypeId, Guid? userUID, string Localization = "RU")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<Violation>(sql: "[dbo].[Administrator_ViolationWithStatisticsSave]", new { TestingProfileId, userUID, ViolationTypeId, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task UpdateQuestionAnswer(IEnumerable<QuestionAnswer> testingLogs)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                var t = testingLogs.Select(a => new { testingPackageId = a.TestingPackageId, time = DateTime.Now, testingTime = a.TestingTime, userAnswer = a.UserAnswer, fileId = a.FileId });
                await cnt.ExecuteAsync(sql: "[dbo].[UserPlace_TestingLogsSave]", new StructuredDynamicParameters(new { testingLogs = t.ToArray() }), commandType: CommandType.StoredProcedure);
            }
        }
        public async Task UpdateQuestionAnswer1(IEnumerable<QuestionAnswer> testingLogs, Guid userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                var t = testingLogs.Select(a => new { testingPackageId = a.TestingPackageId, time = DateTime.Now, testingTime = a.TestingTime, userAnswer = a.UserAnswer, fileId = a.FileId });
                await cnt.ExecuteAsync(sql: "[dbo].[UserPlace_TestingResultSave]", new StructuredDynamicParameters(new { testingLogs = t.ToArray(), userUID }), commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<ChatMessage>> GetChatMessages(int testingProfileId, string Localization)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<ChatMessage>(sql: "[dbo].[Administrator_ChatRoomTestingProfileIdGet]", new { testingProfileId, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<SourceMaterial>> GetSourceMaterials(int testingProfileId, Guid? userUid, string Localization = "RU")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                var result = await cnt.QueryAsync<SourceMaterial>(sql: "[dbo].[Administrator_SourceMaterialsTestingProfileGet]", new { testingProfileId, Localization, userUid }, commandType: CommandType.StoredProcedure);

                //foreach (var item in result)
                //{
                //    if (!item.IsCalc)
                //    {
                //        item.SourceMaterialImage = (await cnt.QueryAsync<SourceMaterial>(sql: "[dbo].[UserPlace_SourceMaterialImageGet]", new { sourceMaterialId = item.Id, Localization, userUid }, commandType: CommandType.StoredProcedure)).First().SourceMaterialImage;
                //        item.Image = Convert.ToBase64String(item.SourceMaterialImage);
                //    }
                //}

                return result;
            }
        }
        public async Task<string> GetSourceMaterial(int sourceMaterialId, Guid? userUid, string Localization = "RU")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                var t = await cnt.QueryFirstOrDefaultAsync<SourceMaterial>(sql: "[dbo].[UserPlace_SourceMaterialImageGet]", new { sourceMaterialId, Localization, userUid }, commandType: CommandType.StoredProcedure);
                return Convert.ToBase64String(t.SourceMaterialImage);
            }
        }
        public async Task<bool> GetSecurity(int testingProfileId, Guid? userUID, string PlaceConfig = null)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryFirstAsync<bool>(sql: "[dbo].[Administrator_TestingProfileCanGet]", new { testingProfileId, userUID, PlaceConfig }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<TestComputer> GetInfoAboutTest(int testingProfileId, Guid? userUID, string Localization = "RU")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryFirstAsync<TestComputer>(sql: "[dbo].[Administrator_TestingProfileInfoGet]", new { testingProfileId, userUID, Localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<int> GetScore(int testingProfileId, Guid? userUID, string Localization = "RU")
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryFirstOrDefaultAsync<int>(sql: "[dbo].[UserPlace_TestingScoreGet]", new { testingProfileId }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<int> SendMessage(ChatMessage message)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryFirstAsync<int>(sql: "[dbo].[Administrator_ChatRoomSave]", new { message.TestingProfileId, message.ParentId, message.UserIdFrom, message.UserIdTo, message.Message, message.Date }, commandType: CommandType.StoredProcedure);
            }
        }
    }
}