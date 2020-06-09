using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.Helpers;
using System.Web.WebSockets;
using WebApp.Models;
using WebApp.Models.Account;
using WebApp.Models.Common;

namespace WebApp
{
    /// <summary>
    /// Сводное описание для ProctorHandler
    /// </summary>
    public class ProctorHandler : IHttpHandler
    {

        private static readonly Dictionary<int, List<WebSocket>> Clients = new Dictionary<int, List<WebSocket>>();
        private static readonly ReaderWriterLockSlim Locker = new ReaderWriterLockSlim();
        public void ProcessRequest(HttpContext context)
        {
            if (context.IsWebSocketRequest)
                context.AcceptWebSocketRequest(WebSocketRequest);
        }
        private async Task WebSocketRequest(AspNetWebSocketContext context)
        {
            // Получаем сокет клиента из контекста запроса
            var socket = context.WebSocket;

            // Добавляем его в список клиентов
            Locker.EnterWriteLock();
            try
            {
                //ToDo change
                //if (!Clients.ContainsKey(1)) Clients.Add(1, socket);
            }
            catch (Exception e)
            {

            }
            finally
            {
                Locker.ExitWriteLock();
            }

            // Слушаем его
            while (true)
            {

                int bufferSize = 1000;
                var buffer = new byte[bufferSize];
                var offset = 0;
                var free = buffer.Length;
                while (true)
                {
                    var result1 = await socket.ReceiveAsync(new ArraySegment<byte>(buffer, offset, free), CancellationToken.None);
                    offset += result1.Count;
                    free -= result1.Count;
                    if (result1.EndOfMessage) break;

                    if (free == 0)
                    {
                        // No free space
                        // Resize the outgoing buffer
                        var newSize = buffer.Length + bufferSize;

                        var newBuffer = new byte[newSize];
                        Array.Copy(buffer, 0, newBuffer, 0, offset);
                        buffer = newBuffer;
                        free = buffer.Length - offset;
                    }
                }

                // Ожидаем данные от него
                //var result = await socket.ReceiveAsync(buffer, CancellationToken.None);
                ProctorSocketModel jsonparsed = new ProctorSocketModel();
                try
                {

                    string cathing = System.Text.Encoding.UTF8.GetString(buffer);
                    int nStrtP = cathing.IndexOf("\0");
                    if (nStrtP != -1) //вхождение нулевого символ найденj
                    {
                        cathing = cathing.Substring(0, nStrtP); //выбираем ограниченный символами текст                
                    }
                    jsonparsed = Json.Decode<ProctorSocketModel>(cathing);

                    if (jsonparsed.ForCreate)
                    {
                        if (!Clients.ContainsKey(jsonparsed.TestingProfileId)) Clients.Add(jsonparsed.TestingProfileId, new List<WebSocket>() { socket });
                        else
                        {
                            List<WebSocket> foundedClient = Clients.Where(a => a.Key == jsonparsed.TestingProfileId).FirstOrDefault().Value;
                            if (!foundedClient.Contains(socket))
                            {
                                foundedClient.Add(socket);
                            }
                        }
                    }
                    else
                    {

                        switch (jsonparsed.Id)
                        {
                            case 1:
                                {
                                    ChatMessage message = Json.Decode<ChatMessage>(jsonparsed.Data);
                                    message.TestingProfileId = jsonparsed.TestingProfileId;
                                    message.UserIdFrom = AccountManager.GetUser(((ClaimsIdentity)context.User.Identity).Claims.Select(a => a.Value).FirstOrDefault()).Id;
                                    message.Id = await TestManager.SendMessage(message);
                                    var newJson = Json.Encode(message);
                                    var anotherJson = Json.Encode(new { Id = 1, Data = newJson });
                                    buffer = System.Text.Encoding.UTF8.GetBytes(anotherJson);
                                    break;
                                }
                            default:
                                {


                                    break;
                                }
                        }

                        List<WebSocket> disposedClients = new List<WebSocket>();
                        //Передаём сообщение всем клиентам
                        foreach (var client in Clients.Where(A => A.Key == jsonparsed.TestingProfileId).FirstOrDefault().Value)
                        {

                            // WebSocket client = client1;

                            try
                            {
                                if (client.State == WebSocketState.Open)
                                {
                                    await client.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, CancellationToken.None);
                                }
                            }

                            catch (ObjectDisposedException)
                            {
                                Locker.EnterWriteLock();
                                try
                                {
                                    //Clients.Remove
                                    List<WebSocket> cls = Clients.Where(A => A.Key == jsonparsed.TestingProfileId).FirstOrDefault().Value;
                                    //cls.Remove(client);
                                    disposedClients.Add(client);

                                    // Clients.Remove(Clients.Where(a => a.Value == client).FirstOrDefault().Key);
                                    //i--;
                                }
                                finally
                                {
                                    Locker.ExitWriteLock();
                                }
                            }
                        }
                        for(int i = 0; i < disposedClients.Count; i++)
                        {
                            List<WebSocket> cls = Clients.Where(A => A.Key == jsonparsed.TestingProfileId).FirstOrDefault().Value;
                            cls.Remove(cls[i]);
                        }
                    }
                }
                catch (Exception e)
                {
                    var t = 1;
                }
            }
        }

        public void RemoveClient(WebSocket client)
        {

        }
        public bool IsReusable
        {
            get
            {
                return false;
            }
        }

        protected TestManager TestManager
        {
            get
            {
                return HttpContext.Current.Request.GetOwinContext().Get<TestManager>();
            }
        }
        protected AccountManager AccountManager
        {
            get
            {
                return HttpContext.Current.Request.GetOwinContext().Get<AccountManager>();
            }
        }
    }
}