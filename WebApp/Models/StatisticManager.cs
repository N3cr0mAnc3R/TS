using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace WebApp.Models
{
    public class StatisticManager : Manager
    {
        public StatisticManager(Concrete concrete) : base(concrete) { }

        public async Task<IEnumerable<dynamic>> FindFioByFamilyName(string Fio, Guid? userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<dynamic>(
                    sql: "[dbo].[SuperAdmin_FindFioByName]",
                    new { userUID, Fio },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public async Task<IEnumerable<dynamic>> GetUserById(int UserId, Guid? userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<dynamic>(
                    sql: "[dbo].[SuperAdmin_GetUserById]",
                    new { userUID, UserId },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public async Task<IEnumerable<dynamic>> ResetProfile(int testingProfileId, Guid? userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(
                    sql: "[dbo].[Administrator_TestingProfileReset]",
                    new { userUID, testingProfileId },
                    commandType: CommandType.StoredProcedure
                );
                return await cnt.QueryAsync<dynamic>(
                    sql: "[dbo].[SuperAdmin_GetUserByTPId]",
                    new { userUID, Id = testingProfileId },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public async Task<IEnumerable<dynamic>> FinishProfile(int testingProfileId, Guid? userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(
                    sql: "[dbo].[UserPlace_TestingEnd]",
                    new { userUID, testingProfileId },
                    commandType: CommandType.StoredProcedure
                );
                return await cnt.QueryAsync<dynamic>(
                    sql: "[dbo].[SuperAdmin_GetUserByTPId]",
                    new { userUID, Id = testingProfileId },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public async Task DeleteProfile(int testingProfileId, Guid? userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(
                    sql: "[dbo].[SuperAdmin_DeleteProfile]",
                    new { userUID, testingProfileId },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public async Task<dynamic> GetCurrentPlace(int userId, Guid? userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryFirstAsync<dynamic>(
                    sql: "[dbo].[SuperAdmin_GetCurrentPlace]",
                    new { userUID, userId },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public async Task<IEnumerable<dynamic>> GetAuditoriums(Guid? userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<dynamic>(
                    sql: "[dbo].[SuperAdmin_GetAuditoriums]",
                    new { userUID },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public async Task<IEnumerable<dynamic>> GetAuditoryInfo(int Id, Guid? userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<dynamic>(
                    sql: "[dbo].[SuperAdmin_GetAuditoryInfo]",
                    new { userUID, Id },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public async Task<dynamic> SetPlaceToUser(int UserId, int PlaceId, Guid? userUID)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryFirstAsync<dynamic>(
                    sql: "[dbo].[SuperAdmin_SetPlaceToUser]",
                    new { userUID, UserId, PlaceId },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
    }
}