let state = PickleStorage.load();
const grid = document.getElementById("courtSelectGrid");

function render() {
  const set = new Set(state.settings.selectedCourts);
  grid.innerHTML = "";
  for (let n=1;n<=10;n++) {
    const label = document.createElement("label");
    label.className = "court-toggle";
    label.innerHTML = `<input type="checkbox" value="${n}" ${set.has(n)?"checked":""}><span>Court ${n}</span>`;
    grid.appendChild(label);
  }
  document.getElementById("selectedCount").textContent = state.settings.selectedCourts.length;
  document.getElementById("selectedList").textContent = "Courts " + state.settings.selectedCourts.join(", ");
}

grid.addEventListener("change", e => {
  if (e.target.type !== "checkbox") return;
  const n = Number(e.target.value);
  const set = new Set(state.settings.selectedCourts);
  e.target.checked ? set.add(n) : set.delete(n);
  if (!set.size) { alert("At least one court must remain selected."); set.add(n); e.target.checked = true; }
  state.settings.selectedCourts = [...set].sort((a,b)=>a-b);
  PickleStorage.save(state); render();
});
document.getElementById("selectAll").onclick = () => {
  state.settings.selectedCourts=[1,2,3,4,5,6,7,8,9,10]; PickleStorage.save(state); render();
};
document.getElementById("court1Only").onclick = () => {
  state.settings.selectedCourts=[1]; PickleStorage.save(state); render();
};
render();